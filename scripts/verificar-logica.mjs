import { quartoSabado, proximaVisita, diasAte, formatarData, formatarDataPorExtenso, ordinal, ehDiaDeVisita, numeroDaVisita, visitaAnterior } from '../lib/datas.js';
import { linkWhatsapp, linkWaze, linkGoogleMaps, telefoneFormatado } from '../lib/links.js';
import { iniciais } from '../lib/cores.js';

let falhas = 0;
function conferir(rotulo, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${rotulo}  =>  ${JSON.stringify(obtido)}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`);
}

console.log('--- 4o sabado ---');
conferir('out/2026 (1o dia e quinta)', quartoSabado(2026, 10), '2026-10-24');
conferir('nov/2026', quartoSabado(2026, 11), '2026-11-28');
conferir('dez/2026', quartoSabado(2026, 12), '2026-12-26');
conferir('fev/2027', quartoSabado(2027, 2), '2027-02-27');
conferir('ago/2026 (mes comeca no sabado)', quartoSabado(2026, 8), '2026-08-22');
conferir('mar/2026 (mes comeca no domingo)', quartoSabado(2026, 3), '2026-03-28');

console.log('--- proxima visita ---');
conferir('antes do dia', proximaVisita('2026-10-02'), '2026-10-24');
conferir('no proprio dia', proximaVisita('2026-10-24'), '2026-10-24');
conferir('depois do dia', proximaVisita('2026-10-25'), '2026-11-28');
conferir('virada de ano', proximaVisita('2026-12-27'), '2027-01-23');
conferir('e dia de visita?', ehDiaDeVisita('2026-10-24'), true);

console.log('--- datas e contagem ---');
conferir('dias ate', diasAte('2026-10-24', '2026-10-02'), 22);
conferir('formato curto', formatarData('2026-10-24'), '24/10/2026');
conferir('por extenso', formatarDataPorExtenso('2026-10-24'), 'sabado, 24 de outubro');
conferir('ordinal', ordinal(8), '8ª');

console.log('--- links ---');
conferir('whatsapp celular', linkWhatsapp('(31) 99999-8888'), 'https://wa.me/5531999998888');
conferir('whatsapp ja com DDI', linkWhatsapp('5531999998888'), 'https://wa.me/5531999998888');
conferir('whatsapp invalido', linkWhatsapp('123'), null);
conferir('telefone exibido', telefoneFormatado('5531999998888'), '(31) 99999-8888');
conferir('waze com coordenada', linkWaze({ latitude: -19.9227, longitude: -43.9451 }), 'https://waze.com/ul?ll=-19.9227%2C-43.9451&navigate=yes');
conferir('waze so com endereco', linkWaze({ latitude: null, longitude: null, endereco: 'Rua A, 1' }), 'https://waze.com/ul?q=Rua%20A%2C%201&navigate=yes');
conferir('maps com coordenada', linkGoogleMaps({ latitude: -19.9227, longitude: -43.9451 }), 'https://www.google.com/maps/search/?api=1&query=-19.9227%2C-43.9451');
conferir('sem nada', linkGoogleMaps({ latitude: null, longitude: null, endereco: null }), null);

console.log('--- iniciais ---');
conferir('nome composto', iniciais('Maria da Silva Santos'), 'MS');
conferir('nome simples', iniciais('Ana'), 'AN');

console.log('--- numero da visita a partir da triagem ---');
conferir('triagem no proprio 4o sabado conta como 1a', numeroDaVisita('2026-10-24', '2026-10-24'), 1);
conferir('mes seguinte vira a 2a', numeroDaVisita('2026-10-24', '2026-11-28'), 2);
conferir('dois meses depois vira a 3a', numeroDaVisita('2026-10-24', '2026-12-26'), 3);
conferir('triagem em dia comum: o 4o sabado seguinte e a 2a', numeroDaVisita('2026-10-02', '2026-10-24'), 2);
conferir('no dia da triagem ainda e a 1a', numeroDaVisita('2026-10-02', '2026-10-23'), 1);
conferir('antes da triagem nao conta', numeroDaVisita('2026-10-24', '2026-10-01'), 0);
conferir('sem triagem nao conta', numeroDaVisita(null, '2026-10-24'), 0);
conferir('virada de ano', numeroDaVisita('2026-12-26', '2027-01-23'), 2);
conferir('um ano inteiro de visitas', numeroDaVisita('2026-01-24', '2026-12-26'), 12);

console.log('--- ultimo dia de visita ---');
conferir('no meio do mes volta para o mes anterior', visitaAnterior('2026-10-02'), '2026-09-26');
conferir('no proprio dia devolve o dia', visitaAnterior('2026-10-24'), '2026-10-24');
conferir('comeco do ano volta para dezembro', visitaAnterior('2027-01-05'), '2026-12-26');

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
