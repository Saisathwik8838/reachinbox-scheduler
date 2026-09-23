# ReachInbox — Full-Stack Email Job Scheduler (Frontend Dashboard)

A React + TypeScript frontend dashboard built for the ReachInbox take-home assignment. It interfaces with the backend REST API to authenticate users via real Google OAuth, display scheduled and sent email jobs with server-side pagination, and schedule bulk email batches with client-side lead list validation and a live send plan simulation.

---

## 1. Quickstart & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (tested on Node v24.1.0)
- **Package Manager**: npm v9+

### Environment Configuration
The frontend uses a Vite dev proxy to forward `/api` requests to your backend server, ensuring that `httpOnly` session cookies remain strictly same-origin.

Copy the example environment file:
```bash
cp .env.example .env
```
Default `.env` contents:
```env
# URL where your local ReachInbox backend service is running
VITE_BACKEND_URL=http://localhost:5000
```

### Installation & Execution Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Execute unit and integration tests (Vitest)
npm run test:run

# 4. Verify TypeScript compilation and build production bundle
npm run build

# 5. Preview production build
npm run preview
```

When running `npm run dev`, Vite will serve the app at `http://localhost:5173`. Any call to `/api/*` will be proxied to your configured `VITE_BACKEND_URL`.

---

## 2. Architecture & Folder Structure

The project strictly separates generic headless UI primitives from email-specific domain components and pure utility logic:

```
src/
├── assets/                    # Static brand assets
├── components/
│   ├── ui/                    # Generic design-system primitives (Headless, 0 external UI kits)
│   │   ├── Badge.tsx          # Pill badges (neutral, blue, green, amber, red, solid-blue, dot, pulse)
│   │   ├── Button.tsx         # Accessible buttons (primary, secondary, outline, ghost, danger, loading)
│   │   ├── ConfirmDialog.tsx  # Modal confirmation prompt for destructive or unsaved actions
│   │   ├── Dialog.tsx         # Accessible modal dialog (portal, focus trap, scroll lock, Esc key)
│   │   ├── EmptyState.tsx     # Centered empty state matching Figma Screen 6
│   │   ├── ErrorBoundary.tsx  # Top-level React error boundary preventing full-app blanking
│   │   ├── Input.tsx          # Text & numeric inputs with label, error, hint, and unit addons
│   │   ├── Skeleton.tsx       # Shimmering loading placeholders
│   │   ├── Spinner.tsx        # Accessible SVG loading indicator
│   │   ├── Table.tsx          # Semantic table wrappers (table, thead, tbody, tr, th, td, overflow)
│   │   ├── Tabs.tsx           # Accessible tab navigation with keyboard arrow navigation & count pills
│   │   ├── Textarea.tsx       # Plain text email body area
│   │   └── Toast.tsx          # Re-export of toast notifications
│   └── email/                 # Domain-specific components
│       ├── AuthGuard.tsx      # Declarative Route Guards (RequireAuth and RequireGuest)
│       ├── ComposeModal.tsx   # Two-column modal matching Figma Screens 3 & 4 with send plan
│       ├── EmailTable.tsx     # Generic typed table reused for Scheduled and Sent tabs
│       ├── Header.tsx         # Brand mark, user info, initials avatar fallback, and logout
│       ├── RecipientUpload.tsx# Drag-and-drop / file picker leads card with verification badges
│       └── StatusBadge.tsx    # Maps email status (sending, scheduled, rescheduled, sent, failed)
├── context/
│   ├── AuthContext.tsx        # Session state via /api/auth/me, logout, and global 401 interception
│   └── ToastContext.tsx       # Floating aria-live notification manager with auto-dismiss
├── hooks/
│   ├── useEmails.ts           # TanStack Query hooks (useScheduledEmails, useSentEmails, invalidation)
│   └── usePageVisibility.ts  # Tracks document visibility state to pause background polling
├── lib/
│   ├── api.ts                 # Typed fetch client, ApiError normalization, and 401 handler
│   ├── avatarUtils.ts         # Pure initials generator with defensive fallbacks
│   ├── csvParser.ts           # Pure CSV/TXT recipient extractor, de-duplication, and size guards
│   ├── dateUtils.ts           # Localized date formatting, relative time hints, and UTC conversions
│   └── sendPlanEstimator.ts   # Mathematical simulation of clock-hour quota windows & delay gaps
├── pages/
│   ├── DashboardPage.tsx      # Main dashboard shell, URL-driven tabs, and table orchestration
│   ├── LoginPage.tsx          # Figma Screen 1: Google OAuth card with redirect feedback
│   └── NotFoundPage.tsx       # Styled 404 recovery page
├── types/
│   ├── api.ts                 # User, AuthMeResponse, PaginatedResponse, ApiError contracts
│   └── email.ts               # Email entity, EmailStatus, ScheduleEmailPayload contracts
├── App.tsx                    # Route definitions, QueryClientProvider, AuthProvider, ToastProvider
├── index.css                  # Tailwind directives and base typography smoothing
└── main.tsx                   # React 18 createRoot mount
```

---

## 3. Component Inventory

| Category | Component | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **UI Primitive** | `Button` | Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), loading spinner, disabled state. |
| **UI Primitive** | `Input` | Label, error alert, helper hint, left icon slot, and right unit addons (e.g. `seconds`, `emails/hour`). |
| **UI Primitive** | `Textarea` | Plain text message composer with character wrapping and error handling. |
| **UI Primitive** | `Dialog` | Portal-rendered accessible modal with focus trap, body scroll lock, and `Escape` key handler. |
| **UI Primitive** | `ConfirmDialog` | Confirmation dialog safeguarding against accidental loss of unsaved drafts. |
| **UI Primitive** | `Badge` | Pill badges supporting solid fills, soft tints, dot indicators, and pulsing animation. |
| **UI Primitive** | `Tabs` | `role="tablist"` navigation with `ArrowLeft`/`ArrowRight` keyboard support and count pills. |
| **UI Primitive** | `Table` | Semantic HTML `<table>` components inside a horizontal overflow container for responsive layout. |
| **UI Primitive** | `Skeleton` | Shimmer pulse placeholder rows matching exact column geometry for initial load states. |
| **UI Primitive** | `EmptyState` | Centered icon, title, description, and primary CTA matching Figma Screen 6. |
| **UI Primitive** | `ErrorBoundary` | React class boundary catching unexpected render crashes and presenting self-recovery actions. |
| **UI Primitive** | `Toast` | Top-right floating `aria-live="polite"` feedback cards with automatic 5-second dismissal. |
| **Domain** | `Header` | Left brand mark; right initials avatar fallback, user name/email with CSS text truncation, and logout. |
| **Domain** | `EmailTable` | **Single generic table** driven by `ColumnDef<T>[]` and reused by Scheduled & Sent tabs. |
| **Domain** | `StatusBadge` | Visual styling for `sending` (pulsing), `scheduled`, `rescheduled` (subtext), `sent`, and `failed`. |
| **Domain** | `RecipientUpload` | Drag-and-drop dropzone (Screen 3) converting to file metadata card with verification badges (Screen 4). |
| **Domain** | `ComposeModal` | 900px two-column scheduling modal with timing inputs, validation, and live send plan summary. |
| **Domain** | `AuthGuard` | Declarative route protection (`RequireAuth` and `RequireGuest`) utilizing React Router `<Outlet />`. |

---

## 4. Data-Fetching & Polling Architecture

Data synchronization is managed via **TanStack Query (v5)**:
1. **URL-Synchronized Pagination**:
   - The active tab (`/dashboard/scheduled` vs `/dashboard/sent`) and page parameters (`?page=1&pageSize=10`) are mirrored directly in the browser URL via `useSearchParams`.
   - Browser refresh, bookmarks, and browser forward/back buttons work seamlessly without resetting view state.
2. **Zero Layout Shift (`keepPreviousData`)**:
   - When navigating across pages or when background refetches trigger, previously rendered rows remain visible while incoming rows load.
   - A subtle 2px pulse bar at the top of the table indicates background activity without jarring layout flashes.
3. **Visibility-Aware Polling**:
   - The Scheduled tab polls the backend every **10 seconds** to detect when emails transition from `scheduled` to `sending` or `sent`.
   - The custom `usePageVisibility` hook tracks `document.visibilityState`. If the user minimizes the window or switches browser tabs, polling is immediately **paused** to conserve battery and network resources. Polling resumes upon returning.
4. **Cross-Tab Invalidation**:
   - Scheduling a new email batch invalidates `['emails']` query cache, updating the Scheduled count pill and table immediately while ensuring the Sent tab reflects latest delivery statuses upon navigation.

---

## 5. Core Logic Modules

All domain calculations and string manipulations live in standalone pure modules outside React components:

### 1. Lead Recipient Parser (`src/lib/csvParser.ts`)
- **Multi-Format Ingestion**: Parses `.csv` and `.txt` files containing comma, semicolon, tab, or newline separators.
- **Defensive Cleansing**: Strips UTF-8 Byte Order Marks (`\uFEFF`), normalizes Windows `\r\n` CRLF and Mac `\r` line endings, unescapes quoted tokens, trims whitespace, and lowercases emails.
- **Header Detection**: Intelligently identifies and skips header lines containing keywords like `Full Name,Email Address,Company`.
- **Deduplication & Rejection Breakdown**: Deduplicates identical leads while collecting the first 15 rejected items with row numbers and exact reasons (e.g., `Row 4: 'not-an-email' — Invalid email format`).
- **Resource Safeguards**: Rejects files larger than **2MB** or exceeding **5,000 rows** to protect the main browser thread.
- **Cross-Environment Reader**: Uses `file.text()` with a fallback to `FileReader.readAsText()` for headless and legacy browser compatibility.

### 2. Send Plan Estimator (`src/lib/sendPlanEstimator.ts`)
- **Signature UX Feature**: Mathematically simulates the timeline and quota consumption for an email batch.
- **Rate-Limiting Simulation**:
  - Models sequential send delays (e.g. 5 seconds between dispatches).
  - Models strict clock-hour quota windows (e.g., 10:00–10:59:59). If an email schedule starts mid-hour (e.g. 10:30 AM with a 100/hr limit), it calculates that 100 will send in the first clock hour and the remaining 27 will roll into the next clock hour starting at 11:00 AM.
  - Conservative single-sender model (`senderCount: 1`).
- **Output Sentence**: Generates clean human-readable summaries matching Figma Screen 4 (e.g. *"127 emails · 100 send in the first hour, 27 roll into the next (finishing around Sep 24, 11:35 AM)"*).

### 3. Date & Relative Time Formatting (`src/lib/dateUtils.ts`)
- **`formatCompactDateTime`**: Formats UTC timestamps to local compact representations (e.g. `Sep 23, 4:30:00 PM`).
- **`formatRelativeHint`**: Appends near-term countdown badges (e.g. `in 12 min`, `in 2 hrs`).
- **`formatFullDateTimeWithZone`**: Renders full accessible tooltip strings including date, time, and local timezone offset.

---

## 6. Feature Checklist Mapped 1:1 to Requirements

| Requirement | Implementation Details | Code Location |
| :--- | :--- | :--- |
| **React + TS Strict Mode** | Configured with `noImplicitAny`, `strictNullChecks`, `isolatedModules`. | [`tsconfig.json`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/tsconfig.json) |
| **Real Google OAuth** | Single Google button linking to `/api/auth/google`, redirect spinner, error banner parsing. | [`src/pages/LoginPage.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/pages/LoginPage.tsx) |
| **Auth Session & Route Guard** | Probes `/api/auth/me` on mount; guards routes with `<RequireAuth />` & `<RequireGuest />`. | [`src/context/AuthContext.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/context/AuthContext.tsx), [`src/components/email/AuthGuard.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/AuthGuard.tsx) |
| **Global Header** | Product logo, user full name, email with truncation, initials avatar fallback, working logout. | [`src/components/email/Header.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/Header.tsx) |
| **URL-Driven Tabs** | `/dashboard/scheduled` and `/dashboard/sent` with keyboard arrow support and count badges. | [`src/pages/DashboardPage.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/pages/DashboardPage.tsx), [`src/components/ui/Tabs.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/ui/Tabs.tsx) |
| **Generic EmailTable (DRY)** | Single table component parameterized by `ColumnDef<T>[]` shared by both tabs. | [`src/components/email/EmailTable.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/EmailTable.tsx) |
| **Scheduled Table View** | Recipient with initial circle, subject, local scheduled time with relative hint, status badge. | [`src/pages/DashboardPage.tsx#L96`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/pages/DashboardPage.tsx#L96) |
| **Sent Table View** | Recipient, subject, sent time, status, inline delivery error reason, and Ethereal preview link. | [`src/pages/DashboardPage.tsx#L162`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/pages/DashboardPage.tsx#L162) |
| **Status Badge Component** | Single badge mapping `sending` (pulse), `scheduled`, `rescheduled` (subtext), `sent`, `failed`. | [`src/components/email/StatusBadge.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/StatusBadge.tsx) |
| **All 4 UX States** | 9-row skeleton loading, background refetch bar, distinct empty states, and actionable error retry. | [`src/components/email/EmailTable.tsx#L70-L150`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/EmailTable.tsx#L70-L150) |
| **Server-Side Pagination** | Previous/Next controls, "Showing X–Y of Z", per-page size dropdown, zero layout shift. | [`src/components/email/EmailTable.tsx#L155`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/EmailTable.tsx#L155) |
| **Background Polling** | 10-second polling on Scheduled tab, automatically paused when browser tab is hidden. | [`src/hooks/useEmails.ts#L22`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/hooks/useEmails.ts#L22), [`src/hooks/usePageVisibility.ts`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/hooks/usePageVisibility.ts) |
| **Accessible Compose Modal** | Focus trap, body scroll lock, Escape key handler, unsaved changes confirmation dialog. | [`src/components/email/ComposeModal.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/ComposeModal.tsx), [`src/components/ui/Dialog.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/ui/Dialog.tsx) |
| **Defensive Lead Parser** | Handles BOM, quotes, headers, delimiters, de-duplication, and 2MB/5,000 row limits. | [`src/lib/csvParser.ts`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/lib/csvParser.ts) |
| **RecipientUpload UI** | Dashed dropzone converting to file metadata card with valid (green) & invalid (amber) badges. | [`src/components/email/RecipientUpload.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/RecipientUpload.tsx) |
| **Timing & Validation** | Datetime picker with local-to-UTC conversion, past-time explanation, delay and limit validation. | [`src/components/email/ComposeModal.tsx#L100-L125`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/email/ComposeModal.tsx#L100-L125) |
| **Send Plan Summary** | Live sentence estimating duration, window distribution, and completion timestamp. | [`src/lib/sendPlanEstimator.ts`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/lib/sendPlanEstimator.ts) |
| **Toast System** | Top-right `aria-live="polite"` toast dismissing after ~5s upon successful scheduling. | [`src/context/ToastContext.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/context/ToastContext.tsx) |
| **Top-Level ErrorBoundary** | Captures unhandled React render crashes and provides styled recovery actions. | [`src/components/ui/ErrorBoundary.tsx`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/components/ui/ErrorBoundary.tsx) |
| **Zero `any` at Boundaries** | Fully typed client, normalized `ApiError`, zero `any` in application code. | [`src/lib/api.ts`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/lib/api.ts), [`src/types/api.ts`](file:///c:/Users/saisa/Projects/reachinbox-scheduler/src/types/api.ts) |

---

## 7. Demo Video Guide & Triggering UX States

When recording your walk-through video, here is how to showcase every state required by evaluators:

### 1. Google OAuth & Auth Shell
- **Logged Out / Login Screen**: Visit `/login`. Point out the official Google "G" logo button, brand mark, and disclaimer.
- **Redirect State**: Click "Continue with Google"; observe that the button disables and displays an active spinner while redirecting to `/api/auth/google`.
- **OAuth Error Handling**: Navigate to `http://localhost:5173/login?error=consent_denied` to showcase the red alert banner explaining that Google permissions were denied.
- **Header & Profile**: Once logged in, observe the header showing user initials (`AS`), full name, email, and the `[-> Log out` button.

### 2. Scheduled Table States
- **Loading State (Skeleton)**: On initial visit to `/dashboard/scheduled`, observe the 9 shimmer skeleton rows with column headers preserved (matching Screen 6).
- **Populated View**: Observe recipient avatar, email, subject, compact local time with relative badge (e.g. `in 12 min`), and the status badge (`• Sending` pulsing, `• Scheduled`, `• Rescheduled` with `Hourly limit reached`).
- **Empty State**: When no emails are scheduled, observe the centered mail icon, *"No scheduled emails"*, and the `+ Compose New Email` CTA button.
- **Background Refetch**: Observe the discreet 2px blue progress bar at the top of the table every 10 seconds without any content flash or table jump. Switch browser tabs to demonstrate polling pause.
- **Server Pagination**: Click `Next` and `Previous` to showcase server-side pagination with the URL updating to `?page=2`. Select `25` or `50` in the per-page dropdown.
- **Out of Range Empty State**: Change the URL to `?page=999` to showcase the *"Page out of range"* empty state with the *"Return to first page"* button.

### 3. Sent Table States
- **Tab Switch**: Click the `Sent 318` tab; URL updates to `/dashboard/sent`.
- **Failed Delivery Rows**: Point out failed rows with red status badge and delivery failure text underneath (e.g. `550 Mailbox unavailable` or `Connection timed out`).
- **Sent Rows & Ethereal Link**: Point out green `• Sent` badge with the `Preview ↗` link opening the Ethereal message preview in a new tab.

### 4. Compose Modal & Leads Processing
- **Modal Opening**: Click `+ Compose New Email` to open the 900px modal dialog.
- **Unsaved Changes Guard**: Type a few letters in the subject line and press `Escape` or click `Cancel`. Point out the confirmation dialog (*"Discard unsaved email?"*). Click *"Keep editing"*.
- **Leads Upload (Empty)**: Drag and drop or browse for a `.csv` or `.txt` file into the dashed dropzone.
- **Leads Loaded State**: Point out file pill (`leads.csv · 14.2 KB · 135 rows`), green badge (`✓ 127 valid email addresses detected`), and amber badge (`⚠ 8 invalid / duplicate rows`). Click the amber badge to view the first rejected items and reasons.
- **Past Start Time Hint**: Pick a start time in the past to show the informational banner: *"Start time is in the past — sending will begin immediately subject to rate limits."*
- **Live Send Plan Estimation**: Point out the live footer calculation: *"127 emails · 100 send in the first hour, 27 roll into the next"*.
- **Submission & Success Toast**: Click `Schedule Emails`. Point out button loading state, modal closure, top-right green toast notification (*"Emails scheduled successfully — 127 emails have been scheduled."*), and table refresh.

### 5. Error & Fallback States
- **Table Error State**: If the backend is unreachable or returns a 500, point out the centered alert icon with *"Unable to load emails"* and the working *"↻ Retry"* button.
- **404 Page**: Visit `/dashboard/unknown-page` to demonstrate the styled 404 recovery page with *"Return to Dashboard"*.
- **Top-Level ErrorBoundary**: Protects the root app so unexpected render errors present a styled recovery screen with *"Reload page"* instead of blanking the screen.

---

## 8. What Was Excluded & Why (Scope Discipline)

To preserve code quality, simplicity, and adherence to the take-home specification, the following features were deliberately excluded:
1. **No External Component Kits (MUI, Chakra, Ant)**: Built all UI primitives from first principles to guarantee 100% token and visual fidelity to Figma without fighting library CSS overrides.
2. **No Rich-Text / WYSIWYG Editor**: The assignment specifically requests a plain-text email body. Adding a rich-text editor (e.g. Quill/TipTap) adds unnecessary bundle weight and divergence from the Figma designs.
3. **No Arbitrary Mock Login / Password Fields**: The assignment strictly forbids mock email/password forms. Authentication relies solely on real Google OAuth redirected to `/api/auth/google`.
4. **No Dark Mode or Theme Switchers**: The design specification provides clean light-theme dashboard designs; adding speculative dark modes would violate the instruction to avoid adding scope beyond the assignment.
5. **No Campaign Analytics / Tracking Charts**: Out-of-scope for the Email Job Scheduler dashboard.
