# Agent Execution Spec — Headless CMS

---

## Global Contract (Applies to All Milestones)

The agent MUST:

* Treat **Markdown as the sole source of truth** for content
* Enforce **site scoping** on all data access
* Build **only what is explicitly listed**
* Prefer **explicit, simple implementations**
* Stop at milestone boundaries

The agent MUST NOT:

* Introduce multi-author logic
* Introduce monetization or payments
* Store rendered HTML
* Store editor-specific JSON
* Add background workers unless specified
* Add features not explicitly listed

If ambiguity is encountered, the agent **MUST STOP and request clarification**.

---

## Milestone 0 — Project Baseline

### Purpose

Establish a running system foundation.

### Preconditions

None.

### Inputs

* Supabase project credentials
* Next.js environment

### Outputs

* Running Next.js app
* Verified Supabase connection

### Forbidden Outputs

* Auth
* CMS features
* Database schema beyond verification

### Scope

* Initialize Next.js app
* Connect Supabase
* Configure environment variables
* Render basic root page

### Acceptance Criteria

* [ ] App runs locally
* [ ] App deploys successfully
* [ ] Supabase connection verified
* [ ] `/` loads without errors

### Completion Rule

STOP after acceptance criteria are met.

### Non-Goals

* Auth
* CMS logic

---

## Milestone 1 — Multi-Site Model & Hostname Routing

### Purpose

Resolve domain → site context.

### Preconditions

* Milestone 0 completed

### Inputs

* Request hostname

### Outputs

* `sites` table
* Resolved `site_id` in request context

### Forbidden Outputs

* Posts
* Auth

### Scope

* Create `sites` table
* Resolve site by hostname
* Route `admin.<domain>` to admin namespace

### Acceptance Criteria

* [ ] `sites(id, name, domain)` exists
* [ ] Hostname resolves correct site
* [ ] Unknown domains fail gracefully
* [ ] Admin subdomain routes correctly

### Completion Rule

STOP after acceptance criteria are met.

### Non-Goals

* Content rendering

---

## Milestone 2 — Admin Authentication & Site Selection

### Purpose

Secure admin access and site scoping.

### Preconditions

* Milestone 1 completed
* `sites` table exists

### Inputs

* Supabase Auth credentials

### Outputs

* Authenticated admin session
* Selected `site_id` persisted

### Forbidden Outputs

* Roles
* Multi-user logic

### Scope

* Admin login
* Site selector UI
* Persist selected site

### Acceptance Criteria

* [ ] Admin routes require auth
* [ ] Login redirects to site selector
* [ ] Site selection persists
* [ ] All admin actions are site-scoped

### Completion Rule

STOP after acceptance criteria are met.

### Non-Goals

* Cross-site admin views

---

## Milestone 3 — Post Model & Draft Management

### Purpose

Enable site-scoped drafts.

### Preconditions

* Milestone 2 completed

### Inputs

* Selected `site_id`

### Outputs

* `posts` table
* Draft records

### Forbidden Outputs

* Published content
* Email logic

### Scope

* Create `posts` table
* Create drafts
* List drafts per site
* Manage title and slug

### Acceptance Criteria

* [ ] Drafts can be created
* [ ] Drafts are site-scoped
* [ ] Drafts not publicly visible
* [ ] Slugs unique per site
* [ ] Draft deletion works

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 4 — Markdown Editor

### Purpose

Enable writing content safely.

### Preconditions

* Milestone 3 completed

### Inputs

* Existing `posts.content_md`

### Outputs

* Updated `content_md` (Markdown only)

### Forbidden Outputs

* HTML storage
* Editor JSON storage

### Scope

* Tiptap core editor
* Markdown serialization
* Save/load content

### Acceptance Criteria

* [ ] Supports headings, lists, links, code, images
* [ ] Markdown stored as plain text
* [ ] Reload restores content
* [ ] No paid extensions used

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 5 — Publishing & Scheduling

### Purpose

Control content visibility and notifications.

### Preconditions

* Milestone 4 completed

### Inputs

* Draft post
* Publish mode (quiet / notify / scheduled)

### Outputs

* Published post
* Updated `published_at`

### Forbidden Outputs

* Implicit email sending

### Scope

* Publish quietly
* Publish & notify flag
* Scheduled publishing
* Update `published_at` on edits

### Acceptance Criteria

* [ ] Quiet publish shows post publicly
* [ ] Notify flag does not auto-send
* [ ] Scheduled posts publish on time
* [ ] Edits update `published_at`
* [ ] Edits do not send email unless chosen

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 6 — Public Rendering & SEO

### Purpose

Serve readable, indexable content.

### Preconditions

* Milestone 5 completed

### Inputs

* Published posts
* Request path

### Outputs

* Rendered public pages

### Forbidden Outputs

* Draft visibility

### Scope

* Markdown rendering
* Syntax highlighting
* Canonical URLs
* Slug redirects

### Acceptance Criteria

* [ ] Published posts render publicly
* [ ] Drafts never render
* [ ] Code blocks render correctly
* [ ] Canonical URLs present
* [ ] Slug changes create redirects

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 7 — Email Subscriptions (Per Site)

### Purpose

Collect subscribers per site.

### Preconditions

* Milestone 6 completed

### Inputs

* Email address
* Site context

### Outputs

* `subscribers` table entries

### Forbidden Outputs

* Email sending

### Scope

* Subscription form
* Subscribe / unsubscribe logic

### Acceptance Criteria

* [ ] Email submission works
* [ ] Subscriber linked to site
* [ ] Same email allowed across sites
* [ ] Unsubscribe disables subscriber

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 8 — Publish → Email Notifications

### Purpose

Notify subscribers on publish.

### Preconditions

* Milestone 7 completed

### Inputs

* Published post
* Subscriber list
* Site email toggle

### Outputs

* Sent email records

### Forbidden Outputs

* Campaign logic
* Digests

### Scope

* Email preview
* Send on publish & notify
* Retry logic
* Per-site enable toggle

### Acceptance Criteria

* [ ] Preview matches post excerpt
* [ ] Emails send only on notify
* [ ] Failures retry remaining
* [ ] No duplicate sends
* [ ] Site toggle respected

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 9 — Impressions & Analytics

### Purpose

Measure site traffic.

### Preconditions

* Milestone 6 completed

### Inputs

* Page view events

### Outputs

* `impressions` records
* Aggregated counts

### Forbidden Outputs

* User tracking
* Cookies

### Scope

* Server-side impression tracking
* Bot exclusion
* Dashboard metrics

### Acceptance Criteria

* [ ] Impressions recorded per site
* [ ] Bots excluded
* [ ] Preview views counted
* [ ] 7/30-day trends visible
* [ ] Per-post totals visible

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 10 — Video CMS Seams

### Purpose

Future-proof video support.

### Preconditions

* Milestone 6 completed

### Inputs

* Markdown with video blocks

### Outputs

* Safe rendering

### Forbidden Outputs

* Video storage
* Playback logic

### Scope

* Reserved `:::video` syntax
* Rendering safety
* Editor embed abstraction

### Acceptance Criteria

* [ ] Video blocks do not break rendering
* [ ] Markdown round-trips intact
* [ ] No video infrastructure exists

### Completion Rule

STOP after acceptance criteria are met.

---

## Milestone 11 — Export & Disaster Recovery

### Purpose

Ensure ownership and exit.

### Preconditions

* Milestone 3 completed

### Inputs

* Posts
* Subscribers

### Outputs

* Markdown exports
* CSV exports

### Forbidden Outputs

* Proprietary formats

### Scope

* Export posts as Markdown
* Export subscribers per site
* Document restore path

### Acceptance Criteria

* [ ] All posts export as Markdown
* [ ] Subscribers export per site
* [ ] Restore path documented
* [ ] No proprietary formats used

### Completion Rule

STOP after acceptance criteria are met.

---

## Final Execution Rule

* Execute **one milestone at a time**
* Validate acceptance criteria
* STOP after completion
* Ask before proceeding if unclear
