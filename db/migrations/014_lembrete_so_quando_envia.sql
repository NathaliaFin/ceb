-- O lembrete so fica anotado quando o e-mail sai. Antes, "tudo registrado"
-- tambem ficava anotado e encerrava a visita: se alguem desmarcasse depois,
-- dentro do prazo, o e-mail nunca saia. As anotacoes desse tipo saem.
DELETE FROM lembretes_enviados WHERE NOT enviado;
