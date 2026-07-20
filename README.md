# Minha Viagem Organizada

Controle financeiro de viagens. O usuário entra com a conta Google, cria uma viagem com destino, datas e orçamento, e registra as despesas por categoria acompanhando quanto do orçamento já foi consumido. Cada viagem tem checklists de preparação, e há um assistente no WhatsApp que responde sobre os gastos e lança despesas por conversa.

## Stack

Backend em Express com Prisma e PostgreSQL 16. Login por Google OAuth 2.0 via Passport, com JWT em cookie httpOnly de 7 dias. Frontend em React 18 com Vite, React Router e Tailwind, gráficos em Recharts.

O assistente usa o SDK da Anthropic com o modelo `claude-opus-4-8` e tool use.

## Rodando

```bash
cp .env.example .env
# preencher GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e JWT_SECRET
docker compose up -d --build
```

Frontend em `http://localhost:3000`, API em `http://localhost:4000` e Postgres na 5432. O backend espera o healthcheck do banco e aplica as migrations antes de subir.

As credenciais do Google saem do Google Cloud Console, em Credenciais → OAuth 2.0. A URL de callback precisa bater exatamente com `GOOGLE_CALLBACK_URL`. O `JWT_SECRET` precisa de no mínimo 32 caracteres.

O assistente do WhatsApp é opcional: sem as variáveis dele, o resto do sistema funciona normalmente.

### Outros composes

| Arquivo | Para quê |
|---|---|
| `docker-compose.yml` | desenvolvimento, com banco local |
| `docker-compose.prod.yml` | produção com Postgres externo; frontend em `WEB_PORT` (padrão 8080), backend não publica porta |
| `docker-compose.full.yml` | servidor novo do zero: sobe banco, backend e frontend, com migrations no boot e dados padrão semeados no primeiro acesso |
| `docker-compose.deploy.yml` | override desta VPS: frontend na 3007 e backend ligado à rede do Postgres compartilhado |

O nginx do container faz proxy de `/api`, `/auth` e `/health` para o backend; o resto cai no `index.html`. Para o nginx do host há um exemplo em `deploy/nginx/`.

### Variáveis

Obrigatórias: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET` e `FRONTEND_URL`.

Para o painel admin: `ADMIN_PASSWORD`.

Para o assistente: `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_DISPLAY_NUMBER` e `ANTHROPIC_API_KEY`. Os tetos padrão de uso ficam em `AI_DEFAULT_MONTHLY_MESSAGE_CAP` e `AI_DEFAULT_MONTHLY_COST_CAP_USD`.

Opcional: `AWESOMEAPI_TOKEN`, para as cotações.

O `FRONTEND_URL` é normalizado no boot — a função remove barras finais e prefixa `https://` quando falta o esquema. Sem isso, um valor como `app.dominio.com/trips` viraria redirect relativo no callback do OAuth.

## Funcionalidades

**Viagens e despesas** — cada viagem tem destino, datas, orçamento e capa (uma das imagens padrão ou upload próprio). As despesas entram por categoria e alimentam os gráficos de consumo por categoria e por dia.

**Categorias** — configuráveis por usuário, editadas no perfil. Cada uma tem nome, ícone e cor. A chave interna é estável, então renomear não quebra as despesas já lançadas. Na primeira leitura o sistema semeia oito categorias padrão.

**Checklists** — funcionam em duas camadas. No perfil o usuário mantém checklists globais, que servem de modelo. Quando uma viagem abre a aba de checklist pela primeira vez, as listas globais ativas são copiadas para ela — a partir daí, editar a lista da viagem não afeta o modelo. Os três modelos padrão são "Na Reserva", "7 Dias Antes da Partida" e "1 Dia Antes da Partida".

**Cotações** — cinco moedas em real, com dados da AwesomeAPI e fallback para a open.er-api. O resultado fica em cache no banco por uma hora; se as duas fontes caírem, o último cache é servido.

**Assistente no WhatsApp** — conversa com o usuário sobre os próprios dados. O vínculo é feito por um código de seis dígitos gerado no perfil, válido por 15 minutos, e não pelo número de telefone — porque a Meta omite o nono dígito nos números brasileiros.

O agente tem seis ferramentas: listar viagens, detalhar uma viagem, listar despesas, ver o checklist pendente, consultar cotações e lançar despesa. Todas operam apenas sobre o usuário vinculado — o identificador não é parâmetro, é fechado no escopo. O lançamento de despesa exige confirmação explícita na conversa antes de gravar.

Cada usuário tem teto mensal de mensagens e de custo, configuráveis pelo painel admin, com zero significando ilimitado. O consumo é registrado por mensagem.

**Painel admin** — em `/admin`, com autenticação própria por senha, separada do login de usuário. Não existe usuário administrador: é uma sessão à parte, com cookie de 8 horas e limite de 8 tentativas a cada 5 minutos por IP.

Tem duas abas. A de usuários lista, busca e ordena os cadastros, incluindo a data do último lançamento, e exporta a seleção em Excel — por linha, por página ou por filtro inteiro. A de IA mostra, por cliente, se o WhatsApp está conectado, se o agente está ativo, os tetos e o consumo do mês, e permite ajustar tudo isso.

## API

**`/auth`** — `GET /google`, `GET /google/callback`, `POST /logout` e `GET /me`.

**`/api/trips`** — CRUD de viagens, mais `GET|POST /:id/expenses` e `GET|POST /:id/checklists`.

**`/api/expenses`**, **`/api/checklists`**, **`/api/tasks`**, **`/api/global-checklists`**, **`/api/global-items`** e **`/api/categories`** — edição e remoção dos respectivos recursos.

**`/api/rates`** — cotações. É a única rota de dados sem autenticação.

**`/api/admin`** — login, listagem e exportação de usuários e gestão das configurações de IA.

**`/api/whatsapp`** — `GET|POST /webhook` para a Meta, e `GET|POST|DELETE /link` para o vínculo, estas exigindo login.

O webhook valida a assinatura `X-Hub-Signature-256` contra o corpo bruto da requisição e responde 200 na hora, processando a mensagem em segundo plano — se demorar, a Meta reenvia. Mensagens repetidas são descartadas por unicidade do id.

## Modelo de dados

Treze tabelas em `backend/prisma/schema.prisma`. Além de `users`, `trips` e `expenses`, há `checklists` e `checklist_tasks` (da viagem), `global_checklists` e `global_checklist_items` (modelos do usuário), `categories`, `currency_rates`, `whatsapp_links`, `wa_messages`, `ai_settings` e `ai_usage`.

Valores monetários são `Decimal(12,2)`. As oito migrations estão em `backend/prisma/migrations/`.

## Estado do projeto

Não há testes automatizados. As verificações disponíveis hoje são `npm run typecheck` no frontend e `npm run build` no backend.
