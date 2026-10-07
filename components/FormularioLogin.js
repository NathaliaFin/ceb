'use client';

import { useActionState } from 'react';
import { entrar } from '@/app/actions';
import { IconeCadeado } from './Icones';

// O rosa do coracao do projeto: o cartao de entrada e "o cartao do grupo".
const COR_DO_PROJETO = '#e0376f';

export default function FormularioLogin() {
  const [estado, acao, pendente] = useActionState(entrar, { erro: null });

  return (
    <div className="login-cartao">
      <form
        action={acao}
        className="cartao cartao--capa entrada"
        style={{ '--cor': COR_DO_PROJETO, animationDelay: '90ms' }}
      >
        <div className="cartao__capa">
          <span className="cartao__selo" aria-hidden="true">
            <IconeCadeado tamanho={22} />
          </span>
          <div className="cartao__sobre">
            <h2>Acesso dos voluntários</h2>
          </div>
        </div>

        <div className="cartao__corpo gap-4">
          <div>
            <label htmlFor="senha" className="block text-sm font-semibold mb-2">
              Senha
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave">
                <IconeCadeado tamanho={17} />
              </span>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                placeholder="Digite a senha"
                className="campo pl-10"
              />
            </div>
          </div>

          {estado?.erro && (
            <p className="bloco-alerta rounded-xl px-3 py-2 text-sm font-medium" role="alert">
              {estado.erro}
            </p>
          )}

          <button type="submit" disabled={pendente} className="botao-primario w-full py-3">
            {pendente ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
