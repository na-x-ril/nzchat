// packages/shared/admin.ts

/**
 * Daftar email CEO yang dianggap superuser.
 */
export const CEO_EMAILS = [
  "onlynazril7z@gmail.com",
];

/**
 * Mengecek apakah email user adalah CEO.
 */
function isCEO(email: string | null | undefined): boolean {
  if (!email) return false;
  return CEO_EMAILS.includes(email.toLowerCase());
}

export { isCEO as checkCEO }