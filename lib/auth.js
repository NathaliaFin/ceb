import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { obterGrupoPorSlug } from './grupos';

// Acesso por senha, sem usuario:
// - cada grupo tem a sua senha, que abre so a caixinha dele (ver, cadastrar e
//   editar as familias do grupo);
// - a senha da administradora (SENHA_ADMIN) abre o painel e todos os grupos.
// A sessao fica num cookie assinado: "admin" ou "grupo-<id>".
const NOME_COOKIE = 'vdps_sessao';
// Cookie de antes dos grupos ("admin" ou "voluntario", ambos do Paranoa04).
// Continua valendo, mas so para o Paranoa04: as duas senhas geravam o mesmo
// cookie, entao nao da para saber se era a administradora.
const COOKIE_ANTIGO = 'ceb_sessao';
const GRUPO_DO_COOKIE_ANTIGO = 'paranoa04';
const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias — o voluntario nao reentra a cada visita

function segredo() {
  const valor = process.env.SESSION_SECRET;
  if (!valor) throw new Error('SESSION_SECRET nao esta definida');
  return valor;
}

function assinatura(valor) {
  return crypto.createHmac('sha256', segredo()).update(valor).digest('base64url');
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

// ---------------------------------------------------------------- senhas

/** Guarda a senha de um grupo como "scrypt$sal$hash" — nunca a senha em si. */
export function gerarHashDaSenha(senha) {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(senha), sal, 32);
  return `scrypt$${sal.toString('base64url')}$${hash.toString('base64url')}`;
}

function confereHash(senha, guardado) {
  const [tipo, sal, hash] = String(guardado ?? '').split('$');
  if (tipo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64url');
  const obtido = crypto.scryptSync(String(senha), Buffer.from(sal, 'base64url'), esperado.length);
  return crypto.timingSafeEqual(obtido, esperado);
}

export function ehSenhaDaAdministradora(senha) {
  const certa = variavel('SENHA_ADMIN');
  if (!certa) console.warn('login: SENHA_ADMIN nao configurada');
  return Boolean(certa) && String(senha ?? '').length > 0 && iguais(senha, certa);
}

/**
 * A senha confere com a do grupo? O Paranoa04, enquanto nao tiver senha
 * definida no painel, continua usando a variavel SENHA_VOLUNTARIO de antes.
 */
export function senhaDoGrupoConfere(grupo, senha) {
  if (!grupo || String(senha ?? '').length === 0) return false;
  if (grupo.senha_hash) return confereHash(senha, grupo.senha_hash);
  if (grupo.slug === GRUPO_DO_COOKIE_ANTIGO) {
    const antiga = variavel('SENHA_VOLUNTARIO');
    return Boolean(antiga) && iguais(senha, antiga);
  }
  return false;
}

// ---------------------------------------------------------------- sessao

async function gravar(valor) {
  const armazenamento = await cookies();
  armazenamento.set(NOME_COOKIE, `${valor}.${assinatura(valor)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_SESSAO,
  });
}

export async function criarSessaoDeAdministradora() {
  await gravar('admin');
}

export async function criarSessaoDoGrupo(grupo) {
  await gravar(`grupo-${grupo.id}`);
}

export async function encerrarSessao() {
  const armazenamento = await cookies();
  armazenamento.delete(NOME_COOKIE);
  armazenamento.delete(COOKIE_ANTIGO);
}

function lerCookie(bruto, valoresAceitos) {
  if (!bruto) return null;
  const separador = bruto.lastIndexOf('.');
  if (separador < 0) return null;
  const valor = bruto.slice(0, separador);
  if (!valoresAceitos(valor)) return null;
  return iguais(bruto.slice(separador + 1), assinatura(valor)) ? valor : null;
}

/**
 * { admin: true } | { grupoId: 12 } | { grupoSlug: 'paranoa04' } (cookie
 * antigo) | null.
 */
export async function sessaoAtual() {
  try {
    const armazenamento = await cookies();
    const valor = lerCookie(armazenamento.get(NOME_COOKIE)?.value, (v) => v === 'admin' || /^grupo-\d+$/.test(v));
    if (valor === 'admin') return { admin: true };
    if (valor) return { grupoId: Number(valor.slice('grupo-'.length)) };

    const antigo = lerCookie(armazenamento.get(COOKIE_ANTIGO)?.value, (v) => v === 'admin' || v === 'voluntario');
    if (antigo) return { grupoSlug: GRUPO_DO_COOKIE_ANTIGO };
    return null;
  } catch {
    return null;
  }
}

export function podeAcessar(sessao, grupo) {
  if (!sessao || !grupo) return false;
  if (sessao.admin) return true;
  if (sessao.grupoId) return sessao.grupoId === grupo.id;
  return sessao.grupoSlug === grupo.slug;
}

/**
 * Para as paginas de um grupo: devolve o grupo, ou manda para o login dele.
 * Endereco que nao e de grupo nenhum -> pagina nao encontrada.
 */
export async function exigirGrupo(slug) {
  const grupo = await obterGrupoPorSlug(slug);
  if (!grupo) notFound();
  const sessao = await sessaoAtual();
  if (!podeAcessar(sessao, grupo)) redirect(`/${grupo.slug}/entrar`);
  return { grupo, sessao };
}

/** Para o painel: so a administradora. */
export async function exigirAdministradora() {
  const sessao = await sessaoAtual();
  if (!sessao?.admin) redirect('/painel/entrar');
  return sessao;
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
