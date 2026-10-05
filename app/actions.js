'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  criarSessao, encerrarSessao, estaBloqueado, exigirAdmin,
  limparFalhas, papelDasCredenciais, registrarFalha,
} from '@/lib/auth';
import {
  atualizarAssistida, criarAssistida, excluirAssistida, substituirFamiliares,
  substituirTriagens,
} from '@/lib/consultas';
import { CHAVES_CORES } from '@/lib/cores';
import { ehLinkCurtoDeMapa, extrairCoordenadas, extrairLink } from '@/lib/links';

async function identificarCliente() {
  const cabecalhos = await headers();
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
}

export async function entrar(_estadoAnterior, formData) {
  const cliente = await identificarCliente();

  if (estaBloqueado(cliente)) {
    return { erro: 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.' };
  }

  const papel = papelDasCredenciais(formData.get('usuario'), formData.get('senha'));
  if (!papel) {
    registrarFalha(cliente);
    return { erro: 'Usuário ou senha incorretos.' };
  }

  limparFalhas(cliente);
  await criarSessao(papel);
  redirect('/');
}

export async function sair() {
  await encerrarSessao();
  redirect('/login');
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
  await exigirAdmin();

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
    necessidades_emergenciais: textoOuNulo(formData.get('necessidades_emergenciais')),
    observacoes: textoOuNulo(formData.get('observacoes')),
    cor: CHAVES_CORES.includes(cor) ? cor : 'rosa',
    ativa: formData.get('ativa') === 'on',
  };

  const idInformado = Number(formData.get('id'));
  const editando = Number.isInteger(idInformado) && idInformado > 0;

  const id = editando ? idInformado : await criarAssistida(dados);
  if (editando) await atualizarAssistida(id, dados);
  await substituirFamiliares(id, lerFamiliares(formData));
  await substituirTriagens(id, triagens);

  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin/assistida/${id}?salvo=1`);
}

export async function acaoExcluirAssistida(formData) {
  await exigirAdmin();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return;

  await excluirAssistida(id);
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin');
}
