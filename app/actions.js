'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  criarSessao, encerrarSessao, estaBloqueado, exigirAdmin, exigirSessao,
  limparFalhas, papelDaSenha, registrarFalha,
} from '@/lib/auth';
import {
  atualizarAssistida, criarAssistida, excluirAssistida, excluirVisita,
  registrarVisita, substituirFamiliares,
} from '@/lib/consultas';
import { hojeIso } from '@/lib/datas';
import { CHAVES_CORES } from '@/lib/cores';

async function identificarCliente() {
  const cabecalhos = await headers();
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
}

export async function entrar(_estadoAnterior, formData) {
  const cliente = await identificarCliente();

  if (estaBloqueado(cliente)) {
    return { erro: 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.' };
  }

  const papel = papelDaSenha(formData.get('senha'));
  if (!papel) {
    registrarFalha(cliente);
    return { erro: 'Senha incorreta.' };
  }

  limparFalhas(cliente);
  await criarSessao(papel);
  redirect('/');
}

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}

/** Qualquer voluntario pode marcar que a visita de hoje foi feita. */
export async function acaoRegistrarVisita(formData) {
  await exigirSessao();

  const assistidaId = Number(formData.get('assistida_id'));
  if (!Number.isInteger(assistidaId)) return;

  const data = String(formData.get('data') || hojeIso());
  const observacao = String(formData.get('observacao') || '').trim();

  await registrarVisita(assistidaId, data, observacao);
  revalidatePath('/');
  revalidatePath(`/admin/assistida/${assistidaId}`);
}

/**
 * Aceita o formato que o Google Maps copia ("-19.9227, -43.9451") e tambem
 * separado por espaco. Sem coordenadas, o Waze e o Maps caem no endereco.
 */
function lerCoordenadas(texto) {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return { latitude: null, longitude: null };

  const partes = bruto.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!partes) {
    throw new Error('Coordenadas em formato nao reconhecido. Use por exemplo: -19.9227, -43.9451');
  }

  const latitude = Number(partes[1]);
  const longitude = Number(partes[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Coordenadas fora do intervalo valido.');
  }
  return { latitude, longitude };
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

  let coordenadas;
  try {
    coordenadas = lerCoordenadas(formData.get('coordenadas'));
  } catch (erro) {
    return { erro: erro.message };
  }

  const dados = {
    nome_completo: nome,
    telefone: textoOuNulo(formData.get('telefone')),
    endereco: textoOuNulo(formData.get('endereco')),
    referencia: textoOuNulo(formData.get('referencia')),
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
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

export async function acaoExcluirVisita(formData) {
  await exigirAdmin();

  const id = Number(formData.get('id'));
  const assistidaId = Number(formData.get('assistida_id'));
  if (!Number.isInteger(id)) return;

  await excluirVisita(id);
  revalidatePath('/');
  revalidatePath(`/admin/assistida/${assistidaId}`);
}
