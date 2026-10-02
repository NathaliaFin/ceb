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

export function linkGoogleMaps(assistida) {
  if (temCoordenadas(assistida)) {
    return `https://www.google.com/maps/search/?api=1&query=${assistida.latitude}%2C${assistida.longitude}`;
  }
  if (assistida.endereco) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assistida.endereco)}`;
  }
  return null;
}
