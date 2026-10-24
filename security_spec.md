# Security Specification — Kalyan & Rajdhani Night Smart Chart Suite

## 1. Data Invariants
1. **Default-Deny Fortress**: Any path not explicitly matched (`/admins/{adminId}`, `/users/{userId}`, `/users/{userId}/passbook/{entryId}`, `/charts/{marketId}/weeklyData/{weekId}`) is unconditionally denied (`allow read, write: if false;`).
2. **PII Isolation (`users/{userId}`)**: Contains user `email`, `displayName`, and `photoURL`. Strictly readable and writable ONLY by the verified document owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) or a verified Admin. Blanket `list` queries on `/users` are strictly forbidden (`allow list: if false;`).
3. **Relational Ownership & Master Gate (`users/{userId}/passbook/{entryId}`)**: Every `PassbookEntry` belongs to `users/{userId}`. Creating or updating an entry requires `exists(/databases/$(database)/documents/users/$(userId))`, `isOwner(userId)`, `incoming().userId == request.auth.uid`, `incoming().id == entryId`, bounded arrays (`otcDigits.size() >= 1 && <= 4`, `jodis.size() <= 8`, `panas.size() <= 6`), and server-enforced timestamps (`request.time`). `allow list` enforces `isOwner(userId) && resource.data.userId == request.auth.uid` without `get()`/`exists()` cost explosion.
4. **Public Chart Read / Verified Admin Write (`charts/{marketId}/weeklyData/{weekId}`)**: Anyone can read valid market chart weeks where `resource.data.market == marketId`. Only a verified administrator (`request.auth.token.email_verified == true` and either present in `/admins/{uid}` or matching bootstrapped runtime admin `secretaryilada1425@gmail.com`) can create, update, or delete weekly chart records, and every write must pass `isValidChartWeek(incoming(), marketId)`.
5. **Immutable & Server Timestamp Integrity**: `uid`, `email`, `userId`, `id`, and `createdAt` can never be mutated during updates; `createdAt` (on create) and `updatedAt` (on create & update) must strictly equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **PII Leak (Cross-User Read)**: User B (`uid: "user_b"`) attempts `get(/users/user_a)` -> Rejected by `isOwner(userId)`.
2. **User Scraping (`list /users`)**: Authenticated user attempts `getDocs(collection(db, "users"))` -> Rejected (`allow list: if false`).
3. **Shadow / Ghost Field Injection**: User A creates `/users/user_a` with `{ ..., isAdmin: true }` -> Rejected by `data.keys().hasOnly(...)`.
4. **Admin Email Spoofing (Unverified Email)**: Attacker with `email: "secretaryilada1425@gmail.com"` and `email_verified: false` attempts `setDoc(/charts/kalyan/weeklyData/w1, ...)` -> Rejected by `request.auth.token.email_verified == true`.
5. **Immutable Field Mutation**: User A updates `/users/user_a` changing `createdAt` or `email` -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().createdAt == existing().createdAt`.
6. **Client Timestamp Forgery**: User A creates a `PassbookEntry` with `createdAt: Timestamp.fromMillis(1000)` -> Rejected by `incoming().createdAt == request.time`.
7. **Orphaned Subcollection Write**: User A attempts to create `/users/user_a/passbook/e1` before `/users/user_a` exists -> Rejected by Master Gate `exists(/databases/$(database)/documents/users/$(userId))`.
8. **Identity Spoofing in Passbook**: User A writes `/users/user_a/passbook/e1` with `userId: "user_b"` -> Rejected by `data.userId == request.auth.uid`.
9. **ID Poisoning / Denial of Wallet**: Attacker sends a 1,500-char junk `entryId` or 50,000-char `note` -> Rejected by `isValidId(entryId)` (`<= 128` chars) and `data.note.size() <= 200`.
10. **Array Overflow / Type Poisoning**: User A submits `otcDigits` with 50 elements or boolean values -> Rejected by `data.otcDigits.size() <= 4 && data.otcDigits[0] is int`.
11. **Value Poisoning on Update**: User A updates `note` on `PassbookEntry` with `{ note: 99999 }` -> Rejected because `isValidPassbookEntry(incoming(), userId, entryId)` wraps the entire `allow update` block.
12. **Unauthorized Chart Tampering**: Regular signed-in user attempts to overwrite Saturday's Jodi in `/charts/kalyan/weeklyData/2026_w43` -> Rejected by `isAdmin()`.

## 3. Automated Security Rule Test Specification
See `firestore.rules.test.ts` for the complete `@firebase/rules-unit-testing` suite asserting `assertFails` across all 12 Dirty Dozen payloads and `assertSucceeds` on valid owner/admin workflows.
