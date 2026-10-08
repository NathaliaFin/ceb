'use client';

import { useActionState, useState } from 'react';
import { acaoSalvarGrupo } from '@/app/actions';
import { CHAVES_CORES, PALETA } from '@/lib/cores';
import { sugerirEndereco } from '@/lib/enderecos';

/** Criar ou editar um grupo, no painel da administradora. */
export default function FormularioGrupo({ grupo }) {
  const [estado, acao, pendente] = useActionState(acaoSalvarGrupo, { erro: null });
  const [nome, setNome] = useState(grupo?.nome ?? '');
  // Ao criar, o endereco acompanha o nome ate a pessoa mexer nele.
  const [endereco, setEndereco] = useState(grupo?.slug ?? '');
  const [enderecoMexido, setEnderecoMexido] = useState(Boolean(grupo));
  const [cor, setCor] = useState(grupo?.cor ?? 'rosa');

  const enderecoMostrado = enderecoMexido ? endereco : sugerirEndereco(nome);

  return (
    <form action={acao} className="cartao p-5 space-y-4" style={{ '--cor': PALETA[cor]?.base ?? '#e0376f' }}>
      {grupo && <input type="hidden" name="id" value={grupo.id} />}

      {estado?.erro && (
        <p className="bloco-alerta rounded-xl px-4 py-3 text-sm font-medium" role="alert">
          {estado.erro}
        </p>
      )}

      <div>
        <label htmlFor="nome" className="block text-sm font-semibold mb-1.5">Nome do grupo</label>
        <input
          id="nome"
          name="nome"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          className="campo"
          placeholder="Riacho Fundo"
          required
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-semibold mb-1.5">Endereço</label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-tinta-suave shrink-0">visitadps.com.br/</span>
          <input
            id="slug"
            name="slug"
            value={enderecoMostrado}
            onChange={(evento) => {
              setEnderecoMexido(true);
              setEndereco(evento.target.value);
            }}
            className="campo"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
        {grupo && (
          <p className="text-xs text-tinta-suave mt-1.5">
            Mudar o endereço obriga quem instalou o app do grupo a instalar de novo.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-semibold mb-1.5">
          {grupo ? 'Nova senha do grupo' : 'Senha do grupo'}
        </label>
        <input
          id="senha"
          name="senha"
          type="text"
          autoComplete="off"
          className="campo"
          placeholder={grupo ? 'Em branco, mantém a atual' : 'A senha que o grupo vai usar'}
          required={!grupo}
        />
        <p className="text-xs text-tinta-suave mt-1.5">
          Quem tem a senha vê, cadastra e edita as famílias deste grupo, e só deste.
        </p>
      </div>

      <div>
        <p className="block text-sm font-semibold mb-1.5">Cor</p>
        <div className="flex gap-2.5">
          {CHAVES_CORES.map((chave) => (
            <button
              key={chave}
              type="button"
              onClick={() => setCor(chave)}
              aria-label={PALETA[chave].nome}
              aria-pressed={cor === chave}
              className="w-8 h-8 rounded-full"
              style={{
                background: PALETA[chave].base,
                outline: cor === chave ? `3px solid ${PALETA[chave].base}` : 'none',
                outlineOffset: 3,
              }}
            />
          ))}
        </div>
        <input type="hidden" name="cor" value={cor} />
      </div>

      <div>
        <label htmlFor="destinatarios" className="block text-sm font-semibold mb-1.5">
          E-mails do lembrete de registro
        </label>
        <textarea
          id="destinatarios"
          name="destinatarios"
          rows={2}
          defaultValue={grupo?.lembrete_destinatarios ?? ''}
          className="campo resize-y"
          placeholder="ana@gmail.com, joao@gmail.com"
        />
        <p className="text-xs text-tinta-suave mt-1.5">
          Recebem o lembrete no 10º dia após a visita, em cópia oculta. Em branco, o grupo não recebe.
        </p>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
        <input type="checkbox" name="ativo" defaultChecked={grupo ? grupo.ativo : true} className="w-4 h-4" />
        Aparece na página principal
      </label>

      <button type="submit" disabled={pendente} className="botao-primario w-full py-3">
        {pendente ? 'Salvando…' : grupo ? 'Salvar' : 'Criar grupo'}
      </button>
    </form>
  );
}
