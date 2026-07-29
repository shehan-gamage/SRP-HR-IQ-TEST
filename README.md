# Cognitive Aptitude Assessment

Pre-employment cognitive screening: HR issues single-use invite links, candidates sit a timed
30-question test in the browser, the server scores it, and results land on an HR dashboard.

Runs entirely on your own machine or office server. No cloud account, no third-party service,
no candidate data leaving the premises.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- SQLite through Node's built-in `node:sqlite` — no native compilation, no database server
- Zero runtime dependencies beyond Next/React

## Setup

```bash
npm install
cp .env.example .env.local
```

Then edit `.env.local`:

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for the shared HR account. Change it before real use. |
| `SESSION_SECRET` | Signing key for the admin cookie, 32+ chars. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `DB_PATH` | SQLite file location. Default `./data/hriq.sqlite`. |
| `COOKIE_SECURE` | Set to `1` only when serving over HTTPS. |
| `SMTP_USER` / `SMTP_PASS` | Optional: Google Workspace mailbox + App Password for emailing invites. Unset = sending disabled, links copied manually. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `MAIL_FROM` | Optional overrides; default to Gmail on 465 sending as `SMTP_USER`. |

```bash
npm run dev     # http://localhost:3000
```

For real use:

```bash
npm run build
npm start
```

To let candidates on the office network reach it, run `npm start` on the server and share
`http://<server-lan-ip>:3000`. The invite links the dashboard generates use whatever host the
browser reached the app on, so open the dashboard by that same LAN address and the links will be
correct.

## How it works

1. **HR signs in** at `/login` and creates an invite (`/admin/new`) with the candidate's name, ID,
   position, a difficulty level — **Basic**, **Advanced** or **Expert**, each a separate 30-item
   bank sat in the same 30 minutes — and optional 25% extra time.
2. **The dashboard issues a link** of the form `/t/<token>` and, when SMTP is configured, emails it
   to the candidate directly (there is also a resend button on the candidate page). The clock
   does *not* start when the link is created, nor when the page is merely opened — only when the
   candidate presses **Begin**.
3. **The candidate sits the test.** Answers autosave every 10 seconds. Closing the tab, refreshing
   or switching device resumes the same paper with the correct time remaining.
4. **Scoring happens on the server** at submission (or when the clock runs out). The candidate sees
   an acknowledgement and can download a receipt PDF showing their final score, sub-domain profile
   and a per-question review with correct answers — a deliberate transparency decision (see
   "Assessment integrity" for the consequence).
5. **HR reviews** the result: score, tier, sub-domain profile and an item-level review with
   rationales. The tier and hiring recommendation are never shown to candidates. Export any
   filtered view to CSV.

## Assessment integrity

- **The answer key never reaches the browser during a sitting.** `src/lib/questions.ts` is
  server-only; the payload sent to a candidate contains stems and options and nothing more. Do not
  import that module from a client component.
- **After submission, the receipt discloses the key.** The receipt PDF includes each question's
  correct answer and rationale so candidates can audit their result. This means the current item
  bank circulates with every receipt — refresh or rotate items periodically, and expect repeat or
  coached candidates to have seen them.
- **Option order is shuffled per sitting.** A leaked answer string ("B, A, B, C…") is worthless to
  the next candidate. Because of this, answer letters in the item review are only meaningful within
  one candidate's report.
- **The clock is server-authoritative.** `started_at` plus `duration_sec` is the deadline. Editing
  the device clock, refreshing, or reopening the link changes nothing; saves and submits arriving
  after the deadline plus a 60-second grace are rejected.
- **One attempt per invite.** The link stops working once submitted.
- **Abandoned sittings close themselves.** Any dashboard load sweeps sittings whose time expired and
  scores them as they stand.

What this does **not** do: prove who sat the test. A remote link authenticates a token, not a
person. Invigilate sittings that carry hiring weight, or re-test shortlisted candidates on site.

## Scoring

One point per correct answer, no negative marking, 30 maximum. Bands and the shortlist cut-off
(19/30) live in `src/lib/scoring.ts` — change them there and every screen, export and guide follows.
The in-app guide at `/admin/guide` carries the full interpretation table and administration rules
(professional caveats were removed from the guide view by request; the ones below still apply and
live only in this README).

**These bands are rational cut-offs, not empirical norms.** Before this test carries real weight in
hiring decisions:

- Re-norm against your own applicant distribution after ~50 sittings.
- Compute item difficulty, item-total correlations and internal consistency; drop or replace weak
  items.
- Monitor adverse impact by gender, ethnicity and age (four-fifths rule).
- Never use it as a sole filter.

## Data protection

The SQLite file holds candidate names, emails, application IDs and scores — personal data. It is
gitignored along with `.env.local`. Back it up somewhere access-controlled, set a retention period,
and delete records when the recruitment round closes (the dashboard has a per-candidate Delete).

## Editing the item bank

`src/lib/questions.ts`. Each item carries a stable `id`, a domain code, the stem, four options in
canonical order, the index of the correct option, and a rationale shown only to HR. **Never renumber
existing ids** — stored sittings reference them. Adding or removing items changes the maximum score,
so revisit the bands in `src/lib/scoring.ts` at the same time.

## Original single-file version

`cognitive-aptitude-test.html` is the earlier standalone version: one offline HTML file, no server,
invigilator-scored on screen. Kept for paper-style on-site sessions or as a fallback. Its answer key
is embedded in the file, so it is only appropriate under invigilation.
