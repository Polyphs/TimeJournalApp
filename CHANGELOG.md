# Changelog

Newest first, grouped by release codename (see engineering standards).

## Unreleased

### Added
- Open the app with `/#/?blocks=<base64url JSON array>` to offer up to 8 titles as blocks (confirm dialog; titles keep history).
- Sign-up nudge: after 3 logged slots (and again after 48) signed-out users are asked to sign up to save and sync; "Not now" snoozes it.
- Block title history: renaming a block records the change; logs keep the title that was active when they were logged.
- Summary lists a renamed block's old and new titles as separate rows.
- Blocks tab shows earlier titles; titles commit on blur/Enter.
