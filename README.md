# Tempo30

A 30-minute time logger built from your notebook sketch: weekly grid (05:00–23:00), 8 focus blocks, a prompt every 30 minutes, a Friday summary, and pre-blocking of focus time. Vue 3 + Quasar + Pinia, Capacitor for Android/iOS, Supabase for auth and sync.

## Run

    npm install
    cp .env.example .env      # optional: add Supabase URL + anon key
    npx quasar dev            # web

Without `.env` the app runs fully offline on the device.

## Supabase

1. Create a project. Run `supabase/schema.sql` in the SQL editor.
2. Put the project URL and anon key in `.env`.
3. Auth > Providers > Email. Turn off "Confirm email" if you want instant sign-up.

Sync is offline-first: writes go to local storage immediately, dirty records are pushed, newer remote records (last write wins by `updated_at`) are pulled.

## Android / iOS

    npx quasar mode add capacitor
    cd src-capacitor && npm i @capacitor/local-notifications && cd ..
    npx quasar dev -m capacitor -T android      # or ios
    npx quasar build -m capacitor -T android

Android 13+ needs the notification permission (the Settings toggle requests it). For exact alarms on Android 12+, also add `SCHEDULE_EXACT_ALARM` to the manifest if prompts drift.

## How it maps to your notes

- Weekly grid with Mon–Sun and 30-min rows; the Focus Blocks legend sits above the grid.
- Prompt every 30 min: Focus block #, Goal-driven, Productive (optional note), or Passing time. Mode is configurable: one tap, full screen, or both.
- Friday notification opens the Summary (productive vs passing vs not logged, hours per focus block).
- After 7 logged days the Blocks tab invites you to reorder blocks by actual hours.
- Future slots on the grid can be pre-blocked (dashed outline) and trigger a reminder at start time.
