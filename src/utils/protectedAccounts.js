export const protectedAdminUid = 'Y24ONBZTuiT9BKXp1Q9F1RGLWPE2';
export function isProtectedAccount(account) {
  return account?.id === protectedAdminUid || String(account?.email || '').trim().toLowerCase() === 'bujeon56@gmail.com';
}
