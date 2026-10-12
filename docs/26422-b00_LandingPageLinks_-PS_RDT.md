# timejournal landing pages: links, handoff contract and change log

Status: RDT (rough draft). Author: PS. Prototype pages live as private claude.ai canvases; sources are copied beside this file.

## Pages

| Page | Purpose | Link | Source in repo |
| --- | --- | --- | --- |
| Home page | Marketing home (`timejournal.app`) | https://claude.ai/artifact/MaRz5cXS3Ba7zxgkv25KaR | `26422-b00_HomePage_-PS_RDT.dc.html` |
| Home page v2 (use cases) | Story pages, one per use case (A, E, P, R) | https://claude.ai/artifact/Q7VCBEsewJBjKUMkm23eGp | `26422-b00_HomePageV2UseCases_-PS_RDT.dc.html` |
| Home page v1 (backup) | Earlier home page, kept as a fallback | https://claude.ai/artifact/AfDRduSDNTa8hV4nVqwTra | `26422-b00_HomePageV1Backup_-PS_RDT.dc.html` |
| Architecture recommendation | Reference | https://claude.ai/artifact/DN65NHHyDbjY3jXnJQooWc | none |
| Engineering standards | Reference | https://claude.ai/artifact/FKngCdooeTwJrDoeMnWXix | `26417-b00_EngineeringStandards_-PS_RDT.md` |

The claude.ai links are private. The `.dc.html` files are the canvas sources and can be re-imported into a Design canvas.

## Page to app handoff

- "Start your first week" and "Start tracking" open the app at `https://app.timejournal.app/#/`. The base is the `appUrl` tweak on each page.
- "Watch Use cases" (top of the home page) opens the v2 page. The target is the `useCasesUrl` tweak.
- Use-case pages offer "Track these N in the app". The link is `<appUrl>?blocks=<base64url JSON array>`:
  - an array of up to 8 strings, each trimmed to 80 characters;
  - it lives in the URL fragment, so it is never sent to a server;
  - the app asks "Use these as your blocks?" before it changes anything, and renamed blocks keep their title history;
  - Work and Family items are prefixed `Work: ` and `Family: `.
- The app asks signed-out users to "Sign up to save and sync your progress" after 3 logged slots, and again at 48. "Not now" snoozes it.

## Use cases on v2

1. Drowning in tasks: list 8 things, see them as blocks in the week.
2. The endless backlog: pick the 3 items that weigh most, see them prebooked.
3. Work and family: 4 items each side, one grid for both.

New use cases are added as one entry in the page script (data only).

## Copy decisions

- Pricing line: "timejournal is free until you choose to pay. No walls, no ads. Pay only when you start finding value."
- Data line: "Your data is yours. Not sold. Not seen by us. Not used to train AI. You choose who you share with."
- "Start with a list" became "Continue with lists"; the review headline became "Tracking shows you the week. The review helps you shape the next one."
- "Support the project" became "Pay when it helps".
- Do not claim "we cannot see your data" until the Locker exists (see `26422-b00_LockerRequirement_-PS_RDT.md`).

## Open items

- [ ] Use cases on v2 as an accordion (one open at a time, `#id` opens that case).
- [ ] Use-case cards on the home page, linking to v2.
- [ ] Restyle the v2 chapters (accent and mini grid per case).
- [ ] Prebooking and the 3-tap reminder: product work, not yet in the app copy beyond the v2 section.
- [ ] Confirm the real v2 link once it is published outside claude.ai.
