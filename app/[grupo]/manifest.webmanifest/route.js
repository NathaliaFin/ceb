import { obterGrupoPorSlug } from '@/lib/grupos';
import { manifesto } from '@/lib/manifesto';

export const dynamic = 'force-dynamic';

// App de um grupo: instalado, abre direto na caixinha dele (/paranoa04).
export async function GET(_pedido, { params }) {
  const { grupo: slug } = await params;
  const grupo = await obterGrupoPorSlug(slug);
  if (!grupo) return new Response('Grupo não encontrado', { status: 404 });
  return manifesto({
    nome: grupo.nome,
    nomeCurto: grupo.nome,
    descricao: `Cartões das famílias atendidas pelo ${grupo.nome}`,
    endereco: `/${grupo.slug}`,
  });
}
