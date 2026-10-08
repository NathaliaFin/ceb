// Consulta o relatorio de visitas do sistema da DPS (dpsfamilia.com.br), onde
// o grupo registra cada visita. O servidor entra com o login guardado nas
// variaveis DPS_USUARIO e DPS_SENHA, so le a tabela e guarda o resultado no
// banco. A consulta leva alguns segundos, entao roda em segundo plano, no
// maximo uma vez por hora; as telas usam sempre a ultima leitura guardada.
import { after } from 'next/server';
import { consultar, consultarUm } from './db';
import { normalizarNome } from './registroDps';

const BASE = 'https://dpsfamilia.com.br';
const INTERVALO_MS = 60 * 60 * 1000;
const TEMPO_LIMITE_MS = 20_000;

function configuracao() {
  const usuario = String(process.env.DPS_USUARIO ?? '').trim();
  const senha = String(process.env.DPS_SENHA ?? '').trim();
  if (!usuario || !senha) return null;
  return {
    usuario,
    senha,
    // 4o Sabado / Paranoa04 — os codigos que o proprio sistema da DPS usa.
    grupo: String(process.env.DPS_GRUPO ?? '3'),
    subgrupo: String(process.env.DPS_SUBGRUPO ?? '2'),
  };
}

/** Navegacao minima com cookies: o sistema da DPS so atende "navegadores". */
function criarSessao() {
  const cookies = new Map();
  const cabecalhos = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9',
    Cookie: [...cookies].map(([nome, valor]) => `${nome}=${valor}`).join('; '),
  });
  const guardar = (resposta) => {
    for (const linha of resposta.headers.getSetCookie?.() ?? []) {
      const [par] = linha.split(';');
      const igual = par.indexOf('=');
      if (igual > 0) cookies.set(par.slice(0, igual).trim(), par.slice(igual + 1));
    }
  };

  return async function ir(caminho, formulario) {
    let resposta = await fetch(BASE + caminho, {
      method: formulario ? 'POST' : 'GET',
      headers: {
        ...cabecalhos(),
        ...(formulario
          ? { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE, Referer: BASE + caminho }
          : {}),
      },
      body: formulario ? new URLSearchParams(formulario) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    guardar(resposta);
    for (let saltos = 0; [301, 302, 303, 307].includes(resposta.status) && saltos < 5; saltos++) {
      resposta = await fetch(new URL(resposta.headers.get('location'), BASE), {
        headers: cabecalhos(),
        redirect: 'manual',
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      });
      guardar(resposta);
    }
    if (!resposta.ok) throw new Error(`DPS respondeu ${resposta.status} em ${caminho}`);
    return resposta.text();
  };
}

function valorDoCampo(html, nome) {
  return (
    html.match(new RegExp(`name="${nome}"[^>]*value="([^"]*)"`))?.[1] ??
    html.match(new RegExp(`value="([^"]*)"[^>]*name="${nome}"`))?.[1] ??
    ''
  );
}

function textoDaCelula(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Entra na DPS e le o relatorio de visitas do grupo. Lanca erro se falhar. */
export async function lerRelatorioDaDps(config = configuracao()) {
  if (!config) throw new Error('DPS_USUARIO e DPS_SENHA nao configurados');
  const ir = criarSessao();

  const login = await ir('/login');
  const logado = await ir('/login_submit', {
    csrf_test_name: valorDoCampo(login, 'csrf_test_name'),
    text_usuario: config.usuario,
    text_senha: config.senha,
    tipo_login: '0',
  });
  if (/name="text_senha"/.test(logado)) throw new Error('login na DPS recusado (usuario ou senha?)');

  const formulario = await ir('/acompvisita_controller');
  const relatorio = await ir('/acompvisita_controller/tratar_relatorios_visita', {
    csrf_test_name: valorDoCampo(formulario, 'csrf_test_name'),
    cd_grpID: config.grupo,
    cd_sbgrpID: config.subgrupo,
    opcao_visita: '1',
    cd_vlntID: valorDoCampo(formulario, 'cd_vlntID'),
  });

  // Colunas: Cod. Familia | Nome Familia | Data Visita | Situacao | (botao)
  const tabela = relatorio.match(/<table[\s\S]*?<\/table>/)?.[0];
  if (!tabela || !/Situa/.test(tabela)) throw new Error('relatorio da DPS sem a tabela esperada');
  return [...tabela.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((linha) => [...linha[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => textoDaCelula(c[1])))
    .filter((celulas) => celulas.length >= 4 && celulas[1])
    .map(([codigo, nome, data, situacao]) => ({ codigo, nome, data: data || null, situacao }));
}

let atualizando = false;

async function atualizar() {
  if (atualizando) return;
  atualizando = true;
  try {
    await consultar(
      `INSERT INTO dps_relatorio (id, tentado_em) VALUES (1, now())
       ON CONFLICT (id) DO UPDATE SET tentado_em = now()`,
    );
    const linhas = await lerRelatorioDaDps();
    await consultar(
      'UPDATE dps_relatorio SET linhas = $1::jsonb, consultado_em = now(), erro = NULL WHERE id = 1',
      [JSON.stringify(linhas)],
    );
  } catch (erro) {
    console.warn('dps: consulta falhou:', erro.message);
    await consultar('UPDATE dps_relatorio SET erro = $1 WHERE id = 1', [erro.message]).catch(() => {});
  } finally {
    atualizando = false;
  }
}

/**
 * A ultima leitura guardada, por nome de familia normalizado. Se ela tiver
 * mais de uma hora (ou nunca houve), agenda uma consulta nova para depois que
 * a tela for entregue — quem abriu nao espera por ela.
 */
export async function situacoesDaDps() {
  if (!configuracao()) return new Map();

  const guardado = await consultarUm('SELECT * FROM dps_relatorio WHERE id = 1').catch(() => null);
  const ultimaTentativa = guardado?.tentado_em ? new Date(guardado.tentado_em).getTime() : 0;
  if (Date.now() - ultimaTentativa > INTERVALO_MS) after(atualizar);

  const mapa = new Map();
  for (const linha of guardado?.linhas ?? []) {
    mapa.set(normalizarNome(linha.nome), {
      codigo: linha.codigo,
      situacao: linha.situacao,
      consultadoEm: guardado.consultado_em ? new Date(guardado.consultado_em).toISOString() : null,
    });
  }
  return mapa;
}
