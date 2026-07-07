// URL do frontend normalizada.
// Garante esquema (https:// por padrão) e remove barra(s) final(is).
// Evita redirect relativo quebrado quando FRONTEND_URL vem sem http(s)://
// (ex.: "app.dominio.com/trips" resolveria relativo a /auth/google/callback).
export function frontendUrl(): string {
  let url = (process.env.FRONTEND_URL ?? 'http://localhost:3000').trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}
