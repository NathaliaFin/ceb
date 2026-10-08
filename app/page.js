import Link from 'next/link';
import { listarGrupos } from '@/lib/grupos';
import { corDe } from '@/lib/cores';
import MarcaCapa from '@/components/MarcaCapa';
import { IconeCadeado, IconePessoas } from '@/components/Icones';

export const dynamic = 'force-dynamic';

/**
 * Pagina principal (publica): os grupos de visita. Mostra so o nome de cada
 * um; para entrar na caixinha de um grupo, pede a senha dele.
 */
export default async function PaginaPrincipal() {
  const grupos = await listarGrupos();

  return (
    <main className="tela-login tela-inicio">
      <header className="capa capa--login entrada">
        <MarcaCapa titulo="Visita DPS" />
      </header>

      <section className="inicio-grupos" aria-label="Grupos">
        {grupos.length === 0 ? (
          <p className="text-center text-white/80 text-sm">Nenhum grupo cadastrado ainda.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {grupos.map((grupo, indice) => (
              <li key={grupo.id}>
                <Link
                  href={`/${grupo.slug}`}
                  className="cartao cartao--capa inicio-grupo entrada"
                  style={{ '--cor': corDe(grupo.cor).base, animationDelay: `${90 + indice * 60}ms` }}
                >
                  <span className="inicio-grupo__nome">{grupo.nome}</span>
                  <span className="inicio-grupo__info">
                    <IconePessoas tamanho={14} />
                    {grupo.familias} {grupo.familias === 1 ? 'família' : 'famílias'}
                  </span>
                  <span className="inicio-grupo__entrar">
                    <IconeCadeado tamanho={14} />
                    Entrar
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center">
        <Link href="/painel" className="text-xs text-white/60 underline underline-offset-2">
          Área da administradora
        </Link>
      </p>
    </main>
  );
}
