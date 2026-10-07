/** Numero so com digitos, com DDI 55 na frente quando for numero local. */
function digitosComPais(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

export function linkWhatsapp(telefone) {
  const numero = digitosComPais(telefone);
  return numero ? `https://wa.me/${numero}` : null;
}

export function linkTelefone(telefone) {
  const numero = digitosComPais(telefone);
  return numero ? `tel:+${numero}` : null;
}

/** "(31) 99999-9999" — so para exibir. */
export function telefoneFormatado(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '');
  const local = digitos.length > 11 ? digitos.slice(2) : digitos;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return telefone ?? '';
}

// ---------------------------------------------------------------- localizacao

/** Links encurtados que o celular gera ao compartilhar — precisam ser abertos
 *  para revelar as coordenadas. */
const HOSPEDEIROS_CURTOS = ['maps.app.goo.gl', 'goo.gl', 'g.co', 'maps.google.com/url'];

/**
 * Tira o primeiro endereco http(s) de um texto colado. O compartilhamento do
 * celular costuma vir com o nome do lugar numa linha e o link na outra.
 */
export function extrairLink(texto) {
  const achado = String(texto ?? '').match(/https?:\/\/[^\s<>"']+/i);
  if (!achado) return null;
  // Pontuacao grudada no fim do link atrapalha ao abrir.
  return achado[0].replace(/[.,;:)\]]+$/, '');
}

export function ehLinkCurtoDeMapa(texto) {
  const bruto = String(texto ?? '');
  return HOSPEDEIROS_CURTOS.some((host) => bruto.includes(host));
}

/**
 * Tira a latitude e a longitude de um link de mapa ou de um par digitado.
 * Cobre os formatos que o Google Maps e o Waze usam ao compartilhar.
 */
export function extrairCoordenadas(texto) {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return null;

  // O link pode vir com a virgula escapada (%2C).
  let alvo = bruto;
  try {
    alvo = decodeURIComponent(bruto);
  } catch {
    // Link com escape invalido: segue com o texto original.
  }

  const numero = String.raw`-?\d{1,3}(?:\.\d+)?`;
  const padroes = [
    new RegExp(String.raw`[?&]q=(${numero}),\s*(${numero})`),
    new RegExp(String.raw`[?&]query=(${numero}),\s*(${numero})`),
    new RegExp(String.raw`[?&]ll=(${numero}),\s*(${numero})`),
    new RegExp(String.raw`[?&]destination=(${numero}),\s*(${numero})`),
    new RegExp(String.raw`[?&]daddr=(${numero}),\s*(${numero})`),
    new RegExp(String.raw`!3d(${numero})!4d(${numero})`),
    new RegExp(String.raw`@(${numero}),(${numero})`),
    // Alfinete solto (casa sem nome): o link curto do celular leva a
    // ".../maps/search/-15.7650,+-47.7777", com as coordenadas no caminho.
    new RegExp(String.raw`/maps/(?:search|place)/(${numero}),\s*\+?\s*(${numero})(?=[/?&]|$)`),
    // Par digitado direto, sem link nenhum.
    new RegExp(String.raw`^(${numero})\s*[,;\s]\s*(${numero})$`),
  ];

  for (const padrao of padroes) {
    const achado = alvo.match(padrao);
    if (!achado) continue;
    const latitude = Number(achado[1]);
    const longitude = Number(achado[2]);
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;
    if (latitude === 0 && longitude === 0) continue;
    return { latitude, longitude };
  }

  return null;
}

function temCoordenadas({ latitude, longitude }) {
  return latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
}

/** Abre o Waze ja navegando. Com coordenadas cai no portao certo; sem elas, na rua. */
export function linkWaze(assistida) {
  if (temCoordenadas(assistida)) {
    return `https://waze.com/ul?ll=${assistida.latitude}%2C${assistida.longitude}&navigate=yes`;
  }
  if (assistida.endereco) {
    return `https://waze.com/ul?q=${encodeURIComponent(assistida.endereco)}&navigate=yes`;
  }
  return null;
}

/**
 * Prefere o link que a administradora colou — e exatamente o ponto que ela
 * marcou. Sem ele, monta a busca pelas coordenadas ou pelo endereco.
 */
export function linkGoogleMaps(assistida) {
  if (assistida.link_mapa) return assistida.link_mapa;
  if (temCoordenadas(assistida)) {
    return `https://www.google.com/maps/search/?api=1&query=${assistida.latitude}%2C${assistida.longitude}`;
  }
  if (assistida.endereco) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assistida.endereco)}`;
  }
  return null;
}

/** Tem como traçar rota de alguma forma? */
export function temComoChegar(assistida) {
  return Boolean(linkWaze(assistida) || linkGoogleMaps(assistida));
}
