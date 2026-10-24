/**
 * Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Specifying PERMISSION_DENIED invariants for `/firestore.rules`.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Cross-user PII profile read is rejected',
    auth: { uid: 'user_b', email: 'b@example.com', email_verified: true },
    operation: 'get',
    path: 'users/user_a',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Blanket list query on /users collection is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'list',
    path: 'users',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow ghost field (isAdmin: true) on user profile creation is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'create',
    path: 'users/user_a',
    payload: { uid: 'user_a', email: 'a@example.com', displayName: 'A', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Admin email spoofing with email_verified=false is rejected',
    auth: { uid: 'spoof_admin', email: 'secretaryilada1425@gmail.com', email_verified: false },
    operation: 'create',
    path: 'charts/kalyan/weeklyData/26-10-26_to_01-11-26',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Mutating immutable email or createdAt on user profile is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'update',
    path: 'users/user_a',
    payload: { email: 'other@example.com' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Client-forged createdAt timestamp on PassbookEntry is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'create',
    path: 'users/user_a/passbook/entry_1',
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned passbook write without parent /users/{uid} document is rejected',
    auth: { uid: 'ghost_user', email: 'g@example.com', email_verified: true },
    operation: 'create',
    path: 'users/ghost_user/passbook/entry_1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Identity spoofing userId != request.auth.uid in passbook is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'create',
    path: 'users/user_a/passbook/entry_1',
    payload: { id: 'entry_1', userId: 'user_b' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet >128 char document ID or >200 char note is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'create',
    path: `users/user_a/passbook/${'x'.repeat(200)}`,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Array overflow (>4 OTC digits) or invalid element type is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'create',
    path: 'users/user_a/passbook/entry_1',
    payload: { otcDigits: [1, 2, 3, 4, 5, 6] },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value poisoning on update (non-string note) is rejected by isValidPassbookEntry wrapper',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'update',
    path: 'users/user_a/passbook/entry_1',
    payload: { note: 12345 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Non-admin authenticated user attempting to overwrite weekly chart data is rejected',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    operation: 'update',
    path: 'charts/kalyan/weeklyData/19-10-26_to_25-10-26',
    expected: 'PERMISSION_DENIED',
  },
];
