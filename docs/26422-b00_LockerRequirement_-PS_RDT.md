# Locker: encrypted storage requirement (parked, not specced)

Status: RDT (rough draft). Author: PS. Parked as a requirement; the spec comes later.

## Requirement

Offer a "Locker" for privacy-conscious users: their records are encrypted on their device before they sync, so the server holds only ciphertext and only the user's key can unlock them. We do not see their data. If the key is lost, the data is lost.

## Intended shape (from discussion, not decided)

- Free tier: policy promises, not a technical claim. "Your data is yours. Not sold. Not seen by us. Not used to train AI. You choose who you share with."
- Paid tier (a reason for privacy-conscious users to pay): the Locker. The user unlocks with a passphrase and a key.
- Alternative to evaluate: a wrapped key held by us that needs the user's passphrase to unlock. It allows password changes and several devices, and it still cannot be opened without the passphrase.
- The sync login password must not double as the encryption passphrase, because the server sees the login password.
- A recovery key is shown once; if both the passphrase and the recovery key are lost, nothing can be recovered.

## Known consequences to resolve in the spec

- Dates, kinds and keys of records may stay readable unless they are encrypted too.
- Server-side features (search, AI insights) are not available for Locker data.
- Accountability sharing must happen on the device, for example a shared Friday summary card or a per-share key.
- Existing synced data needs an additive migration path (see the standards: additive migrations only).
- Wording on public pages must not say "we cannot see your data" for free-tier users.

## Open items

- [ ] Key derivation and storage choice.
- [ ] Which record fields stay plain.
- [ ] Recovery key flow and what the user is told on lost keys.
- [ ] Pricing and the free versus Locker boundary.
