# Deploy — Minha Viagem (servidor novo + domínio wildcard)

Tudo é **criado no deploy**: as tabelas vêm das *migrations* (rodam no boot do
backend via `prisma migrate deploy`) e os dados padrão (categorias, checklists
globais, cotações) são **semeados sob demanda** no primeiro acesso de cada usuário.
Não há passo manual de banco.

## Pré-requisitos no servidor
- Docker + Docker Compose
- nginx (host) e certbot (`certbot` + plugin de DNS do seu provedor, p/ wildcard)

## 1. DNS
Aponte para o IP do servidor:
- `SEUDOMINIO.com`        → IP
- `*.SEUDOMINIO.com`      → IP   (wildcard; cobre `admin.`, etc.)

## 2. Clonar e configurar
```bash
git clone https://github.com/andre5633/minhaviagem.git
cd minhaviagem
cp .env.example .env
nano .env
```
Preencha no `.env`:
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
- `DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@db:5432/<POSTGRES_DB>`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://SEUDOMINIO.com/auth/google/callback`
- `FRONTEND_URL=https://SEUDOMINIO.com`
- `JWT_SECRET` (forte) · `ADMIN_PASSWORD` (forte) · `AWESOMEAPI_TOKEN` (opcional)
- `WEB_PORT=8080` (porta do host onde o frontend é publicado)
- `NODE_ENV=production`

## 3. Subir (cria DB, migra e serve — tudo de uma vez)
```bash
docker compose -f docker-compose.full.yml --env-file .env up -d --build
```
Confira: `docker compose -f docker-compose.full.yml logs backend | grep -i migration`

## 4. nginx do host
```bash
cp deploy/nginx/minhaviagem.conf.example /etc/nginx/sites-available/minhaviagem
# troque SEUDOMINIO.com e a porta (WEB_PORT) no arquivo
ln -s /etc/nginx/sites-available/minhaviagem /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 5. SSL wildcard (Let's Encrypt)
Wildcard exige **desafio DNS-01**:
```bash
certbot certonly --manual --preferred-challenges dns \
  -d 'SEUDOMINIO.com' -d '*.SEUDOMINIO.com'
# crie o registro TXT _acme-challenge que o certbot pedir, depois reload:
systemctl reload nginx
```
(Com plugin de DNS do provedor dá pra automatizar/renovar sem interação.)

## 6. Google Console
Adicione, no OAuth Client:
- Origem JavaScript: `https://SEUDOMINIO.com`
- Redirect URI: `https://SEUDOMINIO.com/auth/google/callback`

## 7. Verificar
- App:   `https://SEUDOMINIO.com`
- Admin: `https://admin.SEUDOMINIO.com`  (ou `https://SEUDOMINIO.com/admin`)
- API:   `https://SEUDOMINIO.com/health` → `{"ok":true}`

---

### Atualizar (deploys seguintes)
```bash
git pull
docker compose -f docker-compose.full.yml --env-file .env up -d --build
```
Migrations novas aplicam sozinhas no boot.

### Variantes de compose
- `docker-compose.full.yml` — **autossuficiente** (sobe o próprio Postgres). Recomendado p/ servidor novo.
- `docker-compose.prod.yml` — usa Postgres **externo** (sem container de banco).
- `docker-compose.yml` — desenvolvimento local.
