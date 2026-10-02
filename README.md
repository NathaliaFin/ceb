# CEB — Cartões das assistidas

Aplicação web para o projeto de voluntariado social. Cada família atendida tem um
cartão com endereço, família, contato e contagem de visitas, pensado para o
voluntário abrir no celular durante a visita.

- **Stack:** Next.js (App Router) + Postgres
- **Hospedagem:** Railway — aplicação e banco no mesmo projeto
- **Dia da visita:** todo 4º sábado do mês (o sistema calcula a data sozinho)

---

## 1. Como as pessoas entram

Há duas senhas, definidas em variáveis de ambiente:

| Senha | Quem usa | O que pode fazer |
|---|---|---|
| `SENHA_VOLUNTARIO` | voluntários | ver os cartões e registrar a visita |
| `SENHA_ADMIN` | administradora | tudo, incluindo cadastrar e editar famílias |

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

Para usar o banco que já está no Railway, pegue a URL pública:

```bash
railway variables --service Postgres
```

Depois:

```bash
npm run migrar   # cria as tabelas, se ainda não existirem
npm run dev      # abre em http://localhost:3000
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

**A contagem de visitas não é um contador.** Cada visita vira uma linha na tabela
`visitas`, e o número no cartão é a contagem dessas linhas. Por isso ele nunca
sai do lugar, e dá para ver o histórico de cada família. Se alguém registrar uma
visita por engano, a administradora apaga no cadastro da assistida e o número se
corrige.

**Duas pessoas não conseguem registrar a mesma visita em duplicidade** — o banco
aceita só um registro por família por dia.

**As coordenadas.** Sem elas, o Waze e o Google Maps abrem pelo texto do
endereço, o que costuma cair no meio da rua. Com elas, abre no ponto certo. Para
pegar: no Google Maps, segure o dedo sobre a casa e copie os números que
aparecem (algo como `-19.9227, -43.9451`).

**Para tirar uma família da lista** sem perder o histórico, desmarque
_Família ativa no projeto_ em vez de apagar o cadastro.
