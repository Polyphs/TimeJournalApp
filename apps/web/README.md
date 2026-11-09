# apps/web: marketing site

Serves `timejournal.app`. Plain static HTML in `public/`: home, use cases, privacy, thanks. No build step.
The signed-in app lives in `apps/app` (`my.timejournal.app`).

## Netlify site settings

- Base directory: `apps/web`
- Build command: empty
- Publish directory: `public`
- Forms: enable form detection (Project configuration, Forms). The `subscribe` form collects emails for the welcome message and the blog.
- Domain: `timejournal.app` (move it here from the old app site at cutover; keep `my.timejournal.app` on the app site).

## Pages

| Path | File |
| --- | --- |
| `/` | `public/index.html` (redirects old `/#/...` app links to `my.timejournal.app`) |
| `/use-cases/` | `public/use-cases/index.html` (interactive, state kept in the page only) |
| `/privacy/` | `public/privacy/index.html` (draft) |
| `/thanks/` | `public/thanks/index.html` |

The pages were converted from the canvas drafts in `docs/26422-*.dc.html`. Edit the HTML here from now on.
