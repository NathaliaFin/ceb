import { manifesto } from '@/lib/manifesto';

// App da pagina principal (a lista de grupos).
export function GET() {
  return manifesto({
    nome: 'Visita DPS',
    nomeCurto: 'Visita DPS',
    descricao: 'Grupos de visita da Diretoria de Promoção Social',
    endereco: '/',
  });
}
