'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  criarSessaoDeAdministradora, criarSessaoDoGrupo, ehSenhaDaAdministradora, encerrarSessao,
  estaBloqueado, exigirAdministradora, gerarHashDaSenha, limparFalhas, podeAcessar,
  registrarFalha, senhaDoGrupoConfere, sessaoAtual,
} from '@/lib/auth';
import {
  atualizarGrupo, criarGrupo, enderecoValido, grupoDaAssistida, grupoDaEmergencia,
  obterGrupo, obterGrupoPorSlug, sugerirEndereco,
} from '@/lib/grupos';
import {
  atualizarAssistida, concluirEmergencia, criarAssistida, desligarAssistida,
  excluirAssistida, excluirEmergencia, listarExcecoesCalendario, mapaDeExcecoes,
  marcarRegistroVisita, reabrirEmergencia, reativarAssistida,
  registrarEmergencia, removerExcecaoCalendario, salvarExcecaoCalendario,
  substituirFamiliares, substituirTriagens,
} from '@/lib/consultas';
import { CHAVES_CORES } from '@/lib/cores';
import { hojeIso, ultimaVisitaFeita } from '@/lib/datas';
import { ehLinkCurtoDeMapa, extrairCoordenadas, extrairLink } from '@/lib/links';

async function identificarCliente() {
  const cabecalhos = await headers();
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
}

// ---------------------------------------------------------------- acesso

/**
 * Entrar num grupo: com a senha do grupo, ou com a da administradora (que abre
 * todos). O grupo vem do formulario ("grupo" = endereco, ex.: paranoa04).
 */
export async function entrar(_estadoAnterior, formData) {
  const cliente = await identificarCliente();
  if (estaBloqueado(cliente)) {
    return { erro: 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.' };
  }

  const grupo = await obterGrupoPorSlug(formData.get('grupo'));
  const senha = formData.get('senha');
  if (grupo && ehSenhaDaAdministradora(senha)) {
    await criarSessaoDeAdministradora();
  } else if (grupo && senhaDoGrupoConfere(grupo, senha)) {
    await criarSessaoDoGrupo(grupo);
  } else {
    registrarFalha(cliente);
    return { erro: 'Senha incorreta.' };
  }

  limparFalhas(cliente);
  redirect(`/${grupo.slug}`);
}

/** Entrar no painel: so a senha da administradora. */
export async function entrarNoPainel(_estadoAnterior, formData) {
  const cliente = await identificarCliente();
  if (estaBloqueado(cliente)) {
    return { erro: 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.' };
  }
  if (!ehSenhaDaAdministradora(formData.get('senha'))) {
    registrarFalha(cliente);
    return { erro: 'Senha incorreta.' };
  }
  limparFalhas(cliente);
  await criarSessaoDeAdministradora();
  redirect('/painel');
}

export async function sair() {
  await encerrarSessao();
  redirect('/');
}

/** O grupo, se a sessao tiver acesso a ele; senao nulo (a acao nao faz nada). */
async function grupoComAcesso(grupo) {
  if (!grupo) return null;
  return podeAcessar(await sessaoAtual(), grupo) ? grupo : null;
}

async function grupoDoFormulario(formData) {
  return grupoComAcesso(await obterGrupoPorSlug(formData.get('grupo')));
}

async function grupoDaFamilia(id) {
  const numero = Number(id);
  return Number.isInteger(numero) ? grupoComAcesso(await grupoDaAssistida(numero)) : null;
}

async function grupoDaNecessidade(id) {
  const numero = Number(id);
  return Number.isInteger(numero) ? grupoComAcesso(await grupoDaEmergencia(numero)) : null;
}

/** Atualiza todas as telas do grupo (cartoes, atendidas, gerenciar...). */
function atualizarTelasDoGrupo(grupo) {
  revalidatePath(`/${grupo.slug}`, 'layout');
  revalidatePath('/');
}

/**
 * Aceita o link que o Google Maps compartilha (inclusive o encurtado do
 * celular) ou um par de coordenadas digitado. Guarda o link como veio — e o
 * ponto exato que ela marcou — e tira dele a latitude e a longitude, que e do
 * que o Waze precisa.
 */
async function lerLocalizacao(texto) {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return { link_mapa: null, latitude: null, longitude: null };

  // Aceita o texto inteiro que veio da area de transferencia: o link pode estar
  // no meio dele, depois do nome do lugar.
  const link = extrairLink(bruto);
  let alvo = link ?? bruto;

  // O link que o celular compartilha e encurtado e nao carrega as coordenadas.
  // Abrimos uma vez, aqui no salvar, so para descobrir o endereco final.
  if (link && ehLinkCurtoDeMapa(link)) {
    try {
      const resposta = await fetch(link, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CEB)' },
      });
      alvo = resposta.url || link;
    } catch {
      // Sem rede ou link fora do ar: segue com o que foi colado.
    }
  }

  const coordenadas = extrairCoordenadas(alvo) ?? extrairCoordenadas(bruto);

  if (!link && !coordenadas) {
    throw new Error(
      'Nao reconheci isso como link de mapa. Cole o link que o Google Maps compartilha, ou as coordenadas no formato -15.7650, -47.7777',
    );
  }

  return {
    link_mapa: link,
    latitude: coordenadas?.latitude ?? null,
    longitude: coordenadas?.longitude ?? null,
  };
}

/**
 * Uma familia pode passar por mais de uma triagem. O formulario manda uma linha
 * por triagem; a lista volta em ordem, e a primeira e a que conta na contagem.
 */
function lerTriagens(formData) {
  const datas = formData.getAll('triagem_data');
  const observacoes = formData.getAll('triagem_observacao');

  const jaVistas = new Set();
  const lista = [];

  for (const [indice, bruto] of datas.entries()) {
    const data = String(bruto ?? '').trim();
    if (!data) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Data de triagem invalida.');
    }
    if (jaVistas.has(data)) continue; // mesma data repetida nao vira duas linhas
    jaVistas.add(data);
    lista.push({
      data,
      observacao: String(observacoes[indice] ?? '').trim() || null,
    });
  }

  return lista.sort((a, b) => (a.data < b.data ? -1 : 1));
}

function lerFamiliares(formData) {
  const nomes = formData.getAll('familiar_nome');
  const parentescos = formData.getAll('familiar_parentesco');
  const idades = formData.getAll('familiar_idade');
  const observacoes = formData.getAll('familiar_observacao');

  return nomes
    .map((nome, indice) => ({
      nome: String(nome).trim(),
      parentesco: String(parentescos[indice] ?? '').trim() || null,
      idade: String(idades[indice] ?? '').trim() === '' ? null : Number(idades[indice]),
      observacao: String(observacoes[indice] ?? '').trim() || null,
    }))
    .filter((familiar) => familiar.nome.length > 0)
    .map((familiar) => ({
      ...familiar,
      idade: Number.isInteger(familiar.idade) && familiar.idade >= 0 && familiar.idade < 130
        ? familiar.idade
        : null,
    }));
}

function textoOuNulo(valor) {
  const texto = String(valor ?? '').trim();
  return texto.length > 0 ? texto : null;
}

export async function acaoSalvarAssistida(_estadoAnterior, formData) {
  const grupo = await grupoDoFormulario(formData);
  if (!grupo) return { erro: 'Sem acesso a este grupo. Entre de novo.' };

  const nome = String(formData.get('nome_completo') ?? '').trim();
  if (nome.length < 2) return { erro: 'Informe o nome completo da assistida.' };

  const cor = String(formData.get('cor') ?? 'rosa');

  let localizacao;
  let triagens;
  try {
    localizacao = await lerLocalizacao(formData.get('link_mapa'));
    triagens = lerTriagens(formData);
  } catch (erro) {
    return { erro: erro.message };
  }

  const dados = {
    nome_completo: nome,
    telefone: textoOuNulo(formData.get('telefone')),
    endereco: textoOuNulo(formData.get('endereco')),
    referencia: textoOuNulo(formData.get('referencia')),
    link_mapa: localizacao.link_mapa,
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    itens_doacao: textoOuNulo(formData.get('itens_doacao')),
    observacoes: textoOuNulo(formData.get('observacoes')),
    cor: CHAVES_CORES.includes(cor) ? cor : 'rosa',
    ativa: formData.get('ativa') === 'on',
  };

  const idInformado = Number(formData.get('id'));
  const editando = Number.isInteger(idInformado) && idInformado > 0;
  // Editando: a familia precisa ser deste mesmo grupo.
  if (editando && (await grupoDaAssistida(idInformado))?.id !== grupo.id) {
    return { erro: 'Esta família não é deste grupo.' };
  }

  const id = editando ? idInformado : await criarAssistida(grupo.id, dados);
  if (editando) await atualizarAssistida(id, dados);
  await substituirFamiliares(id, lerFamiliares(formData));
  await substituirTriagens(id, triagens);

  // O campo da necessidade emergencial sempre registra uma NOVA: as abertas
  // ficam listadas acima dele, e o campo volta vazio para a proxima.
  const novaEmergencia = textoOuNulo(formData.get('nova_emergencia'));
  if (novaEmergencia) await registrarEmergencia(id, novaEmergencia, hojeIso());

  atualizarTelasDoGrupo(grupo);
  redirect(`/${grupo.slug}/gerenciar/${id}?salvo=1`);
}

export async function acaoExcluirAssistida(formData) {
  const id = Number(formData.get('id'));
  const grupo = await grupoDaFamilia(id);
  if (!grupo) return;

  await excluirAssistida(id);
  atualizarTelasDoGrupo(grupo);
  redirect(`/${grupo.slug}/gerenciar`);
}

/**
 * Marca (ou desmarca) "Visita de <mes> registrada" no cartao. O mes e o da
 * ultima visita que ja aconteceu, calculado aqui no servidor pelo calendario e
 * pelo fuso de Brasilia — nao pelo relogio do celular de quem tocou.
 */
export async function acaoMarcarRegistroVisita(id, registrada) {
  const grupo = await grupoDaFamilia(id);
  if (!grupo) return;

  const calendario = mapaDeExcecoes(await listarExcecoesCalendario(grupo.id));
  const visita = ultimaVisitaFeita(hojeIso(), calendario);
  if (!visita) return;

  await marcarRegistroVisita(Number(id), visita.slice(0, 7), Boolean(registrada));
  revalidatePath(`/${grupo.slug}`);
}

/**
 * Desliga a familia do programa (ja foi atendida como devia): sai dos cartoes
 * e vai para "Familias atendidas", com a data de hoje. Chamada direto pelo
 * botao da ficha.
 */
export async function acaoDesligarAssistida(id) {
  const grupo = await grupoDaFamilia(id);
  if (!grupo) return;
  const assistidaId = Number(id);

  await desligarAssistida(assistidaId, hojeIso());
  atualizarTelasDoGrupo(grupo);
}

/** Traz de volta para os cartoes uma familia desligada. */
export async function acaoReativarAssistida(id) {
  const grupo = await grupoDaFamilia(id);
  if (!grupo) return;
  const assistidaId = Number(id);

  await reativarAssistida(assistidaId);
  atualizarTelasDoGrupo(grupo);
}

/**
 * Conclui uma necessidade emergencial: sai do cartao e vai para o historico.
 * Chamada direto pelo botao, sem enviar o formulario do cadastro, para nao
 * perder o que estiver sendo editado nele.
 */
export async function acaoConcluirEmergencia(id) {
  const grupo = await grupoDaNecessidade(id);
  if (!grupo) return;
  const emergencia = Number(id);

  await concluirEmergencia(emergencia, hojeIso());
  atualizarTelasDoGrupo(grupo);
}

/** Desfaz uma conclusao feita por engano: a necessidade volta ao cartao. */
export async function acaoReabrirEmergencia(id) {
  const grupo = await grupoDaNecessidade(id);
  if (!grupo) return;
  const emergencia = Number(id);

  await reabrirEmergencia(emergencia);
  atualizarTelasDoGrupo(grupo);
}

/** Apaga uma necessidade de vez (registrada por engano, por exemplo). */
export async function acaoExcluirEmergencia(id) {
  const grupo = await grupoDaNecessidade(id);
  if (!grupo) return;
  const emergencia = Number(id);

  await excluirEmergencia(emergencia);
  atualizarTelasDoGrupo(grupo);
}

/**
 * Guarda a excecao de um mes: ou a visita nao aconteceu, ou aconteceu em outro
 * dia que nao o padrao (dezembro, por exemplo, costuma cair no 3o sabado).
 */
export async function acaoSalvarExcecaoCalendario(formData) {
  const grupo = await grupoDoFormulario(formData);
  if (!grupo) return;

  const mes = String(formData.get('mes') ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(mes)) return;

  const tipo = String(formData.get('tipo') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim();

  if (tipo === 'sem') {
    await salvarExcecaoCalendario(grupo.id, mes, null, motivo);
  } else {
    const data = String(formData.get('data') ?? '').trim();
    // Data em branco ou fora do mes informado nao vira excecao.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !data.startsWith(mes)) return;
    await salvarExcecaoCalendario(grupo.id, mes, data, motivo);
  }

  atualizarTelasDoGrupo(grupo);
}

/** Devolve o mes ao dia padrao do calendario. */
export async function acaoRemoverExcecaoCalendario(formData) {
  const grupo = await grupoDoFormulario(formData);
  if (!grupo) return;

  const mes = String(formData.get('mes') ?? '').trim();
  if (!/^\d{4}-\d{2}$/.test(mes)) return;

  await removerExcecaoCalendario(grupo.id, mes);
  atualizarTelasDoGrupo(grupo);
}

// ---------------------------------------------------------------- painel

/**
 * Cria ou edita um grupo (so a administradora). A senha e obrigatoria ao criar;
 * ao editar, em branco mantem a atual.
 */
export async function acaoSalvarGrupo(_estadoAnterior, formData) {
  await exigirAdministradora();

  const id = Number(formData.get('id'));
  const editando = Number.isInteger(id) && id > 0;
  const nome = String(formData.get('nome') ?? '').trim();
  const slug = sugerirEndereco(formData.get('slug') || nome);
  const senha = String(formData.get('senha') ?? '');
  const cor = String(formData.get('cor') ?? 'rosa');
  const destinatarios = String(formData.get('destinatarios') ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'))
    .join(', ');

  if (nome.length < 2) return { erro: 'Informe o nome do grupo.' };
  if (!enderecoValido(slug)) return { erro: 'Endereço inválido. Use letras, números e hífen.' };
  if (!editando && senha.length < 4) return { erro: 'Defina uma senha com pelo menos 4 caracteres.' };
  if (editando && senha.length > 0 && senha.length < 4) {
    return { erro: 'A senha precisa de pelo menos 4 caracteres.' };
  }

  const outro = await obterGrupoPorSlug(slug);
  if (outro && outro.id !== id) return { erro: `O endereço /${slug} já é de outro grupo.` };

  const dados = {
    slug,
    nome,
    cor: CHAVES_CORES.includes(cor) ? cor : 'rosa',
    senhaHash: senha ? gerarHashDaSenha(senha) : null,
    destinatarios: destinatarios || null,
    ativo: formData.get('ativo') === 'on',
  };

  if (editando) {
    const antes = await obterGrupo(id);
    if (!antes) return { erro: 'Grupo não encontrado.' };
    await atualizarGrupo(id, dados);
    revalidatePath(`/${antes.slug}`, 'layout');
  } else {
    await criarGrupo(dados);
  }

  revalidatePath('/');
  revalidatePath('/painel');
  redirect('/painel?salvo=1');
}
