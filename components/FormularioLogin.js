'use client';

import { useActionState } from 'react';
import { entrar } from '@/app/actions';
import { IconeCadeado, IconeCoracao } from './Icones';

export default function FormularioLogin() {
  const [estado, acao, pendente] = useActionState(entrar, { erro: null });

  return (
    <div className="w-full max-w-sm entrada">
      <div className="text-center mb-7">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 avatar"
          style={{ '--cor': '#e0376f' }}
        >
          <IconeCoracao tamanho={26} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">CEB</h1>
        <p className="text-sm text-tinta-suave mt-1.5">
          Cartões das famílias atendidas pelo projeto
        </p>
      </div>

      <form action={acao} className="cartao p-5 space-y-4" style={{ '--cor': '#e0376f' }}>
        <div>
          <label htmlFor="senha" className="block text-sm font-semibold mb-2">
            Senha do projeto
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
      </form>

      <p className="text-xs text-tinta-suave text-center mt-5 leading-relaxed">
        Estas informações são das famílias atendidas.
        <br />
        Não compartilhe a senha fora do grupo de voluntários.
      </p>
    </div>
  );
}
