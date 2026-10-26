// O login é por "usuário" (ex.: joao.silva). Por trás, o Supabase exige um e-mail,
// então montamos um e-mail interno a partir do usuário. O colaborador nunca vê isso.

const LOGIN_DOMAIN = process.env.LOGIN_DOMAIN ?? "ucmb.local";

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${username}@${LOGIN_DOMAIN}`;
}

// Sem letras parecidas (0/o, 1/l/i) para a senha ser fácil de ler e digitar.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]).join("");
}
