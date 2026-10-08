import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// O acesso e por senha: a da administradora e a compartilhada do grupo
// (SENHA_VOLUNTARIO). As duas dao acesso completo — consultar, cadastrar e
// editar —, por decisao da administradora.
const NOME_COOKIE = 'ceb_sessao';
const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias — o voluntario nao reentra a cada visita
const PAPEIS = ['admin', 'voluntario'];

function segredo() {
  const valor = process.env.SESSION_SECRET;
  if (!valor) throw new Error('SESSION_SECRET nao esta definida');
  return valor;
}

function assinatura(papel) {
  return crypto.createHmac('sha256', segredo()).update(papel).digest('base64url');
}

// Compara via hash para o tempo de resposta nao variar com o tamanho da senha.
function iguais(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const hashB = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Le a variavel de ambiente perdoando o que costuma vir junto sem querer ao
 * colar no painel do Railway: espaco ou quebra de linha nas pontas e aspas em
 * volta. Sem isso, "senha " nunca bate com o que a pessoa digita.
 */
function variavel(nome) {
  const bruto = String(process.env[nome] ?? '').trim();
  const semAspas = bruto.match(/^(["'])(.*)\1$/);
  return semAspas ? semAspas[2] : bruto;
}

/**
 * Nao ha campo de usuario: basta uma das duas senhas, comparada exatamente
 * como digitada. As duas abrem o sistema inteiro (papel "admin").
 */
export function papelDaSenha(senhaInformada) {
  const senha = String(senhaInformada ?? '');
  if (senha.length === 0) return null;

  const senhaAdmin = variavel('SENHA_ADMIN');
  const senhaVoluntario = variavel('SENHA_VOLUNTARIO');

  // Aparece no log do Railway: ajuda a achar variavel com nome errado ou posta
  // no servico do banco em vez do da aplicacao.
  if (!senhaAdmin) console.warn('login: SENHA_ADMIN nao configurada');
  if (!senhaVoluntario) console.warn('login: SENHA_VOLUNTARIO nao configurada');

  const senhas = [senhaAdmin, senhaVoluntario].filter(Boolean);
  return senhas.some((certa) => iguais(senha, certa)) ? 'admin' : null;
}

export async function criarSessao(papel) {
  const armazenamento = await cookies();
  armazenamento.set(NOME_COOKIE, `${papel}.${assinatura(papel)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_SESSAO,
  });
}

export async function encerrarSessao() {
  const armazenamento = await cookies();
  armazenamento.delete(NOME_COOKIE);
}

export async function papelAtual() {
  try {
    const armazenamento = await cookies();
    const bruto = armazenamento.get(NOME_COOKIE)?.value;
    if (!bruto) return null;

    const separador = bruto.indexOf('.');
    if (separador < 0) return null;

    const papel = bruto.slice(0, separador);
    const assinado = bruto.slice(separador + 1);
    if (!PAPEIS.includes(papel)) return null;
    if (!iguais(assinado, assinatura(papel))) return null;

    // Sessoes de voluntario criadas antes de a senha do grupo dar acesso
    // completo: passam a valer como admin, sem precisar entrar de novo.
    return 'admin';
  } catch {
    return null;
  }
}

/** Para paginas que qualquer pessoa logada pode ver. */
export async function exigirSessao() {
  const papel = await papelAtual();
  if (!papel) redirect('/login');
  return papel;
}

/** Para paginas de edicao: hoje qualquer pessoa logada (as duas senhas sao admin). */
export async function exigirAdmin() {
  const papel = await papelAtual();
  if (!papel) redirect('/login');
  if (papel !== 'admin') redirect('/');
  return papel;
}

// Freio simples contra tentativa de adivinhar a senha. Fica em memoria, entao
// zera a cada deploy — o suficiente para encarecer um ataque automatizado.
//
// O bloqueio vale por IP e segura tambem quem acerta a credencial. Como os
// voluntarios podem estar todos no mesmo Wi-Fi, o limite e folgado de proposito:
// erro de digitacao do grupo nao pode travar a visita.
const LIMITE_TENTATIVAS = 10;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map();

export function estaBloqueado(chave) {
  const registro = tentativas.get(chave);
  if (!registro) return false;
  if (Date.now() > registro.expiraEm) {
    tentativas.delete(chave);
    return false;
  }
  return registro.contagem >= LIMITE_TENTATIVAS;
}

export function registrarFalha(chave) {
  const agora = Date.now();
  const registro = tentativas.get(chave);
  if (!registro || agora > registro.expiraEm) {
    tentativas.set(chave, { contagem: 1, expiraEm: agora + JANELA_MS });
    return;
  }
  registro.contagem += 1;
}

export function limparFalhas(chave) {
  tentativas.delete(chave);
}
