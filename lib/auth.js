import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// O acesso e por senha compartilhada: uma para os voluntarios (consultar e
// registrar visita) e outra para a administradora (editar cadastros).
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

/** Usuario e comparado sem diferenciar maiuscula, porque o teclado do celular
 *  costuma colocar inicial maiuscula sozinho. A senha e comparada exatamente. */
function normalizarUsuario(valor) {
  return String(valor ?? '').trim().toLowerCase();
}

export function papelDasCredenciais(usuarioInformado, senhaInformada) {
  const usuario = normalizarUsuario(usuarioInformado);
  const senha = String(senhaInformada ?? '');
  if (usuario.length === 0 || senha.length === 0) return null;

  const contas = [
    { papel: 'admin', usuario: process.env.USUARIO_ADMIN, senha: process.env.SENHA_ADMIN },
    { papel: 'voluntario', usuario: process.env.USUARIO_VOLUNTARIO, senha: process.env.SENHA_VOLUNTARIO },
  ];

  for (const conta of contas) {
    if (!conta.usuario || !conta.senha) continue;
    if (iguais(usuario, normalizarUsuario(conta.usuario)) && iguais(senha, conta.senha)) {
      return conta.papel;
    }
  }
  return null;
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

    return iguais(assinado, assinatura(papel)) ? papel : null;
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

/** Para paginas de edicao — so a administradora. */
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
