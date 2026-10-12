# apps/web: marketing site

Serves `timejournal.app`. Static pages only: home, use cases, blog, donate, about, legal.
Not scaffolded yet. It deploys as its own Netlify site (base `apps/web`) so a marketing edit never triggers an app release.
The signed-in app lives in `apps/app` (`app.timejournal.app`).
