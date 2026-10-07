# CEB — Cartões das assistidas

Aplicação web para o projeto de voluntariado social. Cada família atendida tem um
cartão com endereço, família, contato e contagem de visitas, pensado para o
voluntário abrir no celular durante a visita.

- **Stack:** Next.js (App Router) + Postgres
- **Hospedagem:** Railway — aplicação e banco no mesmo projeto
- **Dia da visita:** todo 4º sábado do mês (o sistema calcula a data sozinho)

---

## 1. Como as pessoas entram

A tela de entrada pede só a senha. Há duas, definidas em variáveis de ambiente,
e o sistema reconhece quem entrou por qual delas foi digitada:

| Senha | Quem usa | O que pode fazer |
|---|---|---|
| `SENHA_VOLUNTARIO` | voluntários | ver os cartões |
| `SENHA_ADMIN` | administradora | tudo, incluindo cadastrar e editar famílias |

As duas precisam ser diferentes: se forem iguais, o acesso de admin fica
desligado até a variável ser corrigida. A senha é comparada exatamente como
digitada.

Quem entra com a senha de admin vê o botão **Gerenciar**. A sessão dura 30 dias,
para o voluntário não ter que digitar senha a cada visita.

Para trocar uma senha, altere a variável no Railway e reimplante. Todo mundo
continua logado — as sessões antigas só caem se você trocar `SESSION_SECRET`.

---

## 2. Rodando na sua máquina

```bash
npm install
```

Crie um arquivo `.env.local` na raiz (ele não vai para o GitHub) copiando o
`.env.example` e preenchendo:

```
DATABASE_URL=...
SENHA_VOLUNTARIO=...
SENHA_ADMIN=...
SESSION_SECRET=...
```

Para gerar o `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O banco do Railway **não tem porta pública** — é o comportamento desejado, ele só
conversa com a aplicação pela rede interna. Por isso a sua máquina não alcança
esse banco direto. Para desenvolver localmente, use um Postgres instalado na sua
máquina e aponte o `DATABASE_URL` para ele. Se um dia precisar mesmo acessar o
banco de produção de fora, habilite o _TCP Proxy_ no painel do serviço Postgres
e desabilite depois.

```bash
npm run migrar     # cria as tabelas, se ainda não existirem
npm run verificar  # confere o cálculo do 4º sábado e os links
npm run dev        # abre em http://localhost:3000
```

---

## 3. Publicando uma alteração

```bash
git add .
git commit -m "descrição do que mudou"
git push
```

O Railway detecta o push, constrói e publica sozinho. As migrações do banco
rodam automaticamente no início de cada deploy — não é preciso mexer no banco
pela mão.

> **Passo único, se ainda não foi feito:** no painel do Railway, serviço `web` →
> _Settings_ → _Source_ → conectar o repositório `NathaliaFin/ceb`. Sem isso o
> push vai só para o GitHub e não dispara deploy; nesse caso dá para publicar
> manualmente com `railway up --service web`.

---

## 4. Mudanças no banco de dados

Nunca altere tabelas direto pelo painel. Crie um arquivo novo em
`db/migrations/`, com número maior que o último:

```
db/migrations/002_o_que_mudou.sql
```

Escreva o SQL (`ALTER TABLE`, `CREATE TABLE`…) e faça o push. O migrador aplica
só o que ainda não rodou e guarda o registro na tabela `_migracoes`.

---

## 5. Backup

**O Railway não faz backup sozinho.** No painel, abra o serviço Postgres, vá em
_Backups_ e agende. As opções são diária (guarda 6 dias), semanal (27 dias) ou
mensal (89 dias). Para este projeto, a semanal é suficiente — as visitas
acontecem uma vez por mês.

---

## 6. Organização do código

```
app/
  page.js                    tela principal com os cartões
  login/                     entrada por senha
  admin/                     área da administradora
  actions.js                 operações de escrita (server actions)
components/                  cartão, painel, formulários, ícones
lib/
  auth.js                    sessão por senha compartilhada
  consultas.js               leitura e escrita no banco
  datas.js                   cálculo do 4º sábado e formatação
  links.js                   WhatsApp, Waze e Google Maps
  cores.js                   paleta dos cartões
db/
  migrations/                arquivos .sql em ordem
  migrate.mjs                aplica o que falta, a cada deploy
```

---

## 7. Detalhes que valem saber

**A contagem de visitas sai do calendário, não de confirmação.** A triagem conta
como uma visita normal — é a primeira — e cada 4º sábado do mês depois dela soma
mais uma. Ninguém precisa marcar nada: o número se atualiza sozinho a cada mês
que passa.

A triagem vale pelo mês em que aconteceu. Se ela cair em 20/12, o 4º sábado
daquele mesmo dezembro não conta de novo — a contagem recomeça em janeiro.

Exemplo: triagem em 23/05/2026, olhando em 02/10/2026 → 5 visitas (a triagem
mais 27/06, 25/07, 22/08 e 26/09).

**O dia da visita** é o 4º sábado do mês, exceto em **dezembro**, que é o 3º.

Quando um mês fugir da regra, abra _Gerenciar_ → _Calendário das visitas_. Cada
mês pode ser corrigido de duas formas: **mudar a data** (a visita aconteceu em
outro dia) ou **marcar que não houve**. Vale para **todas** as famílias de uma
vez — a visita é coletiva — e os números dos cartões se corrigem sozinhos.
"Voltar ao padrão" desfaz.

**Uma família pode ter mais de uma triagem.** Todas ficam registradas e
aparecem no cartão, mas **a contagem usa sempre a primeira** — as demais são
histórico, não reiniciam nem somam ao número.

**Enquanto nenhuma triagem é registrada**, o cartão mostra um traço no lugar do
número, e aparece um filtro "Sem triagem" na tela principal para localizar quem
ainda falta.

**O link do mapa.** No cadastro, cole o link que o Google Maps compartilha — no
celular, abra o local, toque em Compartilhar e copie. Ao salvar, o sistema tira
a latitude e a longitude do link e guarda as duas coisas: o link (que o Google
Maps abre no ponto exato que você marcou) e as coordenadas (que é do que o Waze
precisa).

Links encurtados (`maps.app.goo.gl/...`), que é o que o celular gera, são
abertos uma vez no momento de salvar só para descobrir o endereço completo. Se
isso falhar, o link continua valendo para o Google Maps e o Waze cai na busca
pelo endereço escrito — a ficha da família avisa quando é o caso.

No cartão há um único botão **Como chegar**, que pergunta se é para abrir no
Waze ou no Google Maps e manda para o aplicativo instalado.

**Para tirar uma família da lista** sem perder o histórico, desmarque
_Família ativa no projeto_ em vez de apagar o cadastro.
