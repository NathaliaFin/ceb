import { visitaParaLembrar, ultimaVisitaFeita, situacaoDoPrazo, somarDias, quartoSabado, proximaVisita, diasAte, formatarData, formatarDataPorExtenso, ordinal, ehDiaDeVisita, numeroDaVisita, visitaAnterior, primeiraTriagem, terceiroSabado, diaDeVisitaPadrao, etapaDoCiclo } from '../lib/datas.js';
import { linkWhatsapp, linkWaze, linkGoogleMaps, telefoneFormatado, extrairCoordenadas, ehLinkCurtoDeMapa, extrairLink } from '../lib/links.js';
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
conferir('por extenso', formatarDataPorExtenso('2026-10-24'), 'sábado, 24 de outubro');
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
conferir('o 4o sabado do mes da triagem nao conta de novo', numeroDaVisita('2026-10-02', '2026-10-24'), 1);
conferir('a 2a visita e no mes seguinte ao da triagem', numeroDaVisita('2026-10-02', '2026-11-28'), 2);
conferir('no dia da triagem ainda e a 1a', numeroDaVisita('2026-10-02', '2026-10-23'), 1);
conferir('antes da triagem nao conta', numeroDaVisita('2026-10-24', '2026-10-01'), 0);
conferir('sem triagem nao conta', numeroDaVisita(null, '2026-10-24'), 0);
conferir('virada de ano', numeroDaVisita('2026-12-26', '2027-01-23'), 2);
conferir('um ano inteiro de visitas', numeroDaVisita('2026-01-24', '2026-12-26'), 12);

console.log('--- ultimo dia de visita ---');
conferir('no meio do mes volta para o mes anterior', visitaAnterior('2026-10-02'), '2026-09-26');
conferir('no proprio dia devolve o dia', visitaAnterior('2026-10-24'), '2026-10-24');
conferir('comeco do ano volta para dezembro', visitaAnterior('2027-01-05'), '2026-12-26');

console.log('--- contagem com a triagem incluida ---');
conferir('no dia da triagem ja e 1 visita', numeroDaVisita('2026-10-24', '2026-10-24'), 1);
conferir('triagem antes do 4o sabado nao soma duas no mesmo mes', numeroDaVisita('2025-12-20', '2025-12-31'), 1);
// Os dois casos reais, conferidos contra a lista de datas da Nathalia.
// Julho de 2026 nao teve visita: nao aparece na lista de nenhuma das duas.
const SEM_JULHO = { '2026-07': null };
conferir('Carmen: triagem 20/12/2025, em 05/10/2026 sao 9', numeroDaVisita('2025-12-20', '2026-10-05', SEM_JULHO), 9);
conferir('Vanilde: triagem 23/05/2026, em 05/10/2026 sao 4', numeroDaVisita('2026-05-23', '2026-10-05', SEM_JULHO), 4);
conferir('Carmen contaria 10 se julho tivesse acontecido', numeroDaVisita('2025-12-20', '2026-10-05'), 10);
conferir('dois meses sem visita tiram dois', numeroDaVisita('2025-12-20', '2026-10-05', { '2026-07': null, '2026-08': null }), 8);
conferir('cancelar o mes da triagem nao tira a triagem', numeroDaVisita('2025-12-20', '2026-01-24', { '2025-12': null }), 2);
conferir('visita adiada dentro do mes ainda conta', numeroDaVisita('2026-05-23', '2026-10-05', { '2026-07': '2026-07-18' }), 5);
conferir('visita adiada para depois da referencia nao conta ainda', numeroDaVisita('2026-05-23', '2026-09-30', { '2026-09': '2026-09-30' }), 5);
conferir('proxima visita pula o mes cancelado', proximaVisita('2026-10-05', { '2026-10': null }), '2026-11-28');
conferir('proxima visita respeita a data corrigida', proximaVisita('2026-10-05', { '2026-10': '2026-10-31' }), '2026-10-31');
conferir('proxima visita normal sem excecao', proximaVisita('2026-10-05', {}), '2026-10-24');

console.log('--- dezembro cai no 3o sabado ---');
conferir('3o sabado de dez/2025', terceiroSabado(2025, 12), '2025-12-20');
conferir('padrao de dezembro e o 3o sabado', diaDeVisitaPadrao(2025, 12), '2025-12-20');
conferir('padrao de outubro segue o 4o sabado', diaDeVisitaPadrao(2026, 10), '2026-10-24');
conferir('dez/2026 cai em 19', diaDeVisitaPadrao(2026, 12), '2026-12-19');
conferir('em dezembro a proxima visita e o 3o sabado', proximaVisita('2026-12-01', {}), '2026-12-19');
conferir('um mes depois sao 2', numeroDaVisita('2026-10-24', '2026-11-28'), 2);
conferir('Vanilde na proxima visita, 24/10, vira 5', numeroDaVisita('2026-05-23', '2026-10-24', SEM_JULHO), 5);
conferir('antes da triagem nao conta', numeroDaVisita('2026-10-24', '2026-10-01'), 0);
conferir('sem triagem nao conta', numeroDaVisita(null, '2026-10-24'), 0);

console.log('--- reta final do ciclo de 7 visitas ---');
conferir('5 visitas e normal', etapaDoCiclo(5), 'normal');
conferir('6 visitas: falta 1', etapaDoCiclo(6), 'falta-uma');
conferir('7 visitas: ciclo completo, o aviso continua', etapaDoCiclo(7), 'ciclo-completo');
conferir('Carmen com 9: o aviso continua, nada se encerra', etapaDoCiclo(9), 'ciclo-completo');
conferir('triagem 28/03/2026, sem julho, em 06/10 tem 6 e falta 1', etapaDoCiclo(numeroDaVisita('2026-03-28', '2026-10-06', SEM_JULHO)), 'falta-uma');

console.log('--- caixa "Visita de <mes> registrada" ---');
conferir('08/10: ainda pergunta pela de setembro (26/09)', ultimaVisitaFeita('2026-10-08'), '2026-09-26');
conferir('23/10: continua setembro', ultimaVisitaFeita('2026-10-23'), '2026-09-26');
conferir('24/10, dia da visita: passa a ser outubro', ultimaVisitaFeita('2026-10-24'), '2026-10-24');
conferir('05/11, registro atrasado ainda e de outubro', ultimaVisitaFeita('2026-11-05'), '2026-10-24');
conferir('dezembro no 3o sabado (19/12)', ultimaVisitaFeita('2026-12-20'), '2026-12-19');
conferir('mes sem visita e pulado', ultimaVisitaFeita('2026-08-10', { '2026-07': null }), '2026-06-27');
conferir('somar 14 dias atravessa o mes', somarDias('2026-10-24', 14), '2026-11-07');
conferir('prazo folgado (dia 10 apos a visita)', situacaoDoPrazo('2026-10-24', '2026-11-03'), null);
conferir('faltam 3 dias: atencao', situacaoDoPrazo('2026-10-24', '2026-11-04'), 'perto');
conferir('ultimo dia do prazo: atencao', situacaoDoPrazo('2026-10-24', '2026-11-07'), 'perto');
conferir('dia seguinte ao prazo: vencido', situacaoDoPrazo('2026-10-24', '2026-11-08'), 'vencido');

console.log('--- lembrete por e-mail no 10o dia ---');
conferir('9o dia (02/11): ainda nao', visitaParaLembrar('2026-11-02'), null);
conferir('10o dia (03/11): lembra a visita de 24/10', visitaParaLembrar('2026-11-03'), '2026-10-24');
conferir('14o dia (07/11): ainda vale, se o 10o falhou', visitaParaLembrar('2026-11-07'), '2026-10-24');
conferir('15o dia (08/11): prazo acabou, nao envia', visitaParaLembrar('2026-11-08'), null);
conferir('dezembro (visita 19/12): lembra em 29/12', visitaParaLembrar('2026-12-29'), '2026-12-19');

console.log('--- a triagem que conta e a primeira ---');
conferir('lista vazia', primeiraTriagem([]), null);
conferir('uma so', primeiraTriagem([{ data: '2026-06-27' }]), '2026-06-27');
conferir('pega a mais antiga mesmo fora de ordem', primeiraTriagem([
  { data: '2026-08-22' }, { data: '2026-06-27' }, { data: '2026-07-25' },
]), '2026-06-27');
conferir('segunda triagem nao muda a contagem', numeroDaVisita(
  primeiraTriagem([{ data: '2026-06-27' }, { data: '2026-08-22' }]), '2026-10-02'), 4);

console.log('--- link de mapa ---');
const doPedido = 'https://www.google.com/maps?q=-15.76500415802002,-47.77771759033203&z=17&hl=pt-BR';
conferir('link que a Nathalia passou', extrairCoordenadas(doPedido), { latitude: -15.76500415802002, longitude: -47.77771759033203 });
conferir('link com /@lat,lng,zoom', extrairCoordenadas('https://www.google.com/maps/@-15.765,-47.7777,17z'), { latitude: -15.765, longitude: -47.7777 });
conferir('link de lugar com !3d!4d', extrairCoordenadas('https://www.google.com/maps/place/Casa/@-15.7,-47.7,17z/data=!3d-15.765!4d-47.7777'), { latitude: -15.765, longitude: -47.7777 });
conferir('link no formato api=1&query', extrairCoordenadas('https://www.google.com/maps/search/?api=1&query=-15.765,-47.7777'), { latitude: -15.765, longitude: -47.7777 });
conferir('virgula escapada como %2C', extrairCoordenadas('https://www.google.com/maps/search/?api=1&query=-15.765%2C-47.7777'), { latitude: -15.765, longitude: -47.7777 });
conferir('link do proprio Waze', extrairCoordenadas('https://waze.com/ul?ll=-15.765,-47.7777&navigate=yes'), { latitude: -15.765, longitude: -47.7777 });
conferir('par digitado na mao', extrairCoordenadas('-15.765, -47.7777'), { latitude: -15.765, longitude: -47.7777 });
conferir('texto que nao e mapa', extrairCoordenadas('Quadra 28 conjunto H casa 04'), null);
conferir('vazio', extrairCoordenadas(''), null);
conferir('reconhece link encurtado do celular', ehLinkCurtoDeMapa('https://maps.app.goo.gl/AbCdEf123'), true);
conferir('link normal nao e encurtado', ehLinkCurtoDeMapa(doPedido), false);
conferir('alfinete solto: /maps/search/lat,+lng', extrairCoordenadas('https://www.google.com/maps/search/-15.765004,+-47.777717?entry=tts&g_ep=EgoyMDI2'), { latitude: -15.765004, longitude: -47.777717 });
conferir('alfinete solto com %2C e %2B', extrairCoordenadas('https://www.google.com/maps/search/-15.765004%2C%2B-47.777717?entry=tts'), { latitude: -15.765004, longitude: -47.777717 });
conferir('alfinete em /maps/place/lat,lng', extrairCoordenadas('https://www.google.com/maps/place/-15.765004,-47.777717/data=!4m2'), { latitude: -15.765004, longitude: -47.777717 });
conferir('pagina de aviso de cookies com o link dentro', extrairCoordenadas('https://consent.google.com/ml?continue=https://www.google.com/maps/search/-15.765004,%2B-47.777717?entry%3Dtts&gl=BR'), { latitude: -15.765004, longitude: -47.777717 });
conferir('lugar com nome nao vira coordenada falsa', extrairCoordenadas('https://www.google.com/maps/place/Quadra+28+Conjunto+H/data=!4m2!3m1!1s0x0:0x0'), null);

console.log('--- rota prefere o link cadastrado ---');
conferir('Maps usa o link colado', linkGoogleMaps({ link_mapa: doPedido, latitude: -15.765, longitude: -47.7777 }), doPedido);
conferir('Maps sem link cai nas coordenadas', linkGoogleMaps({ link_mapa: null, latitude: -15.765, longitude: -47.7777 }), 'https://www.google.com/maps/search/?api=1&query=-15.765%2C-47.7777');
conferir('Waze usa as coordenadas, nao o link', linkWaze({ link_mapa: doPedido, latitude: -15.765, longitude: -47.7777 }), 'https://waze.com/ul?ll=-15.765%2C-47.7777&navigate=yes');

console.log('--- link colado junto com outro texto ---');
conferir('nome do lugar antes do link', extrairLink(['Carmen Silva', 'https://maps.app.goo.gl/AbC123'].join(String.fromCharCode(10))), 'https://maps.app.goo.gl/AbC123');
conferir('link solto', extrairLink(doPedido), doPedido);
conferir('ponto final grudado no link', extrairLink('veja aqui https://maps.app.goo.gl/AbC123.'), 'https://maps.app.goo.gl/AbC123');
conferir('texto sem link nenhum', extrairLink('Quadra 28 conjunto H'), null);
conferir('coordenadas digitadas nao viram link', extrairLink('-15.765, -47.7777'), null);
conferir('acha as coordenadas do link colado com texto', extrairCoordenadas(extrairLink('Casa da Carmen ' + doPedido)), { latitude: -15.76500415802002, longitude: -47.77771759033203 });

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
