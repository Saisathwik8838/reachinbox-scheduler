# Architectural Decisions (DECISIONS.md)

This log records every significant technical and architectural decision, the alternatives considered and rejected, and the rationale behind each choice.

---

### 1. Application Framework: Vite + React 18 SPA vs Next.js
- **Decision**: Use Vite with React 18 and TypeScript in strict mode.
- **Alternative Rejected**: Next.js App Router or Pages Router.
- **Why**: The application is an internal dashboard located strictly behind a Google OAuth authentication barrier. It requires no public search engine indexing (SEO) or server-side rendering (SSR). An SPA built with Vite yields near-instant local HMR, lightweight output with no Node server runtime requirement, predictable client-only state lifecycles, and a clean dev proxy configuration for handling `httpOnly` session cookies without CORS complexity.

---

### 2. State & Data-Fetching Management: TanStack Query v5 vs Hand-rolled Custom Hooks
- **Decision**: TanStack Query v5 (`@tanstack/react-query`).
- **Alternative Rejected**: Hand-rolled `useEffect` + `useState` custom hooks or Redux/Zustand.
- **Why**: The assignment requires server-side pagination with seamless page transitions (`keepPreviousData` / `placeholderData`), ~10-second polling on the Scheduled tab that automatically pauses when the browser tab is hidden, immediate cache invalidation when emails are scheduled or sent, and distinct loading, error, and empty states. TanStack Query handles request deduplication, cache eviction, background polling, and tab visibility natively with zero boilerplate, making it vastly simpler to explain and defend in an interview than writing complex custom timers and cache stores from scratch.

---

### 3. Styling & Token Architecture: Tailwind CSS with Curated Design Tokens vs Component UI Kits
- **Decision**: Tailwind CSS utility classes mapped to custom semantic tokens in `tailwind.config.js`.
- **Alternative Rejected**: Pre-styled UI kits (Material UI, Chakra UI, Ant Design) or raw unconfigured CSS.
- **Why**: Pre-styled component libraries dictate opinionated component geometry and make exact pixel/token fidelity to custom Figma designs difficult. By defining design tokens (brand blue `#2563eb`, surface canvas `#f3f4f6`, status pills, and card borders) directly inside `tailwind.config.js`, we ensure 100% adherence to the 7 provided Figma screens with zero scattered magic hex numbers.

---

### 4. Same-Origin Session Architecture: Vite Dev Proxy vs Cross-Origin CORS
- **Decision**: Vite dev proxy mapping `/api` -> `process.env.VITE_BACKEND_URL || 'http://localhost:5000'`.
- **Alternative Rejected**: Direct cross-origin browser requests with `credentials: 'include'` and backend CORS headers.
- **Why**: Dev proxy ensures the frontend and backend appear same-origin during local development. The browser automatically receives and transmits `httpOnly` session cookies without requiring third-party cookie exceptions or fragile cross-origin cookie policies.

---

### 5. Lead File Limits & Client-Side Defensive Parsing
- **Decision**: Enforce a 2MB file cap and a maximum of 5,000 rows client-side in `lib/csvParser.ts`.
- **Alternative Rejected**: Allowing unbounded file uploads or relying entirely on backend parsing.
- **Why**: Parsing massive files purely on the main thread would freeze the browser UI during CSV regex operations. Capping at 2MB/5,000 rows protects client responsiveness while immediately surfacing clear, helpful feedback (counts of valid, invalid, and duplicate leads) before network transmission.

---

### 6. Accessible Modal/Dialog: Hand-crafted Focus Trap & Portal vs External Library (Headless UI / Radix)
- **Decision**: Hand-crafted React Portal dialog with custom focus trap, scroll lock, and keyboard listeners.
- **Alternative Rejected**: Pulling in `@headlessui/react` or `@radix-ui/react-dialog`.
- **Why**: The assignment asks candidates to avoid heavy UI dependencies and to be able to explain every primitive in an interview. Our hand-crafted `Dialog` implements exact WCAG 2.1 modal semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, body scroll lock, focus trap (cycling Tab / Shift+Tab between active focusable elements), and restoring focus to the trigger on close, requiring zero third-party dependencies.

---

### 7. Toast Notification Architecture: React Context + aria-live vs External Libraries (Sonner / React Hot Toast)
- **Decision**: Lightweight `ToastContext` with `aria-live="polite"` region and self-dismissing cards.
- **Alternative Rejected**: Third-party toast packages (Sonner, react-toastify, react-hot-toast).
- **Why**: Screen 7 defines an exact toast layout (green checkmark / red exclamation icon pill, bold title, subtitle, top-right absolute positioning, dismiss button, auto-fade). A custom Context provider is ~70 lines of clean, understandable code, zero dependency footprint, and accessible to screen readers natively.

---

### 8. Semantic Table Architecture: Compound Primitives with Responsive Overflow
- **Decision**: Semantic HTML `table` primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) wrapped in an `overflow-x-auto` container.
- **Alternative Rejected**: CSS Grid / Flexbox table emulations.
- **Why**: Real HTML `<table>` elements provide natural accessibility for screen readers and tab navigation. Wrapping them in a responsive scroll container ensures that wide table columns gracefully scroll on narrow laptop or mobile viewports without breaking the outer dashboard layout.

---

### 9. Typed API Client & Normalized ApiError Envelope
- **Decision**: Centralize all remote HTTP requests inside `src/lib/api.ts` with strict TypeScript input/output contracts and a custom `ApiError` class.
- **Alternative Rejected**: Ad-hoc `fetch()` calls scattered across components or un-typed Axios instances.
- **Why**: Eliminates `any` at API boundaries, normalizes diverse HTTP error payloads into a predictable `{ status, code, message, fieldErrors }` envelope, and allows unit testing of data extraction without mocking browser fetch internals.

---

### 10. Proactive 401 Session Interception
- **Decision**: Global 401 listener in `src/lib/api.ts` that triggers `AuthContext` eviction and redirects to `/login?redirect=...`, while intentionally exempting the initial `/api/auth/me` probe.
- **Alternative Rejected**: Handling 401 redirection individually inside every component or query error callback.
- **Why**: If a session expires mid-session (cookie invalidation), any failing query immediately and cleanly evicts the local user state and prompts sign-in. Exempting `/api/auth/me` prevents unwanted redirect loops when checking if a guest has an active session.

---

### 11. Declarative Route Guarding with React Router Outlets
- **Decision**: Layout route wrappers `<RequireAuth />` and `<RequireGuest />` using React Router v6 `<Outlet />`.
- **Alternative Rejected**: Manual `useEffect` redirects placed inside each page component.
- **Why**: Declarative wrappers prevent flashing protected UI before authentication checks complete, seamlessly preserve destination paths via `location.state.from`, and maintain clean URL history without redundant component renders.

---

### 12. Defensive Avatar and Identity Truncation
- **Decision**: Pure `getInitials` helper that falls back from full name to email initial or 'U', plus CSS flexbox truncation with tooltip titles.
- **Alternative Rejected**: Generic placeholder images or fixed-width layout clipping.
- **Why**: Evaluators test long names and emails (e.g. `arjun.mehta@kestrel.ai`, `25+ character emails`). CSS text truncation with native `title` tooltips ensures visual alignment is preserved on all screen sizes while full identities remain inspectable.

---

### 13. Generic Column-Driven EmailTable Architecture (Single DRY Component)
- **Decision**: Implement a single, generic `EmailTable<T>` component driven by a strongly typed `ColumnDef<T>[]` configuration array.
- **Alternative Rejected**: Building separate `ScheduledEmailTable.tsx` and `SentEmailTable.tsx` components.
- **Why**: Building two separate tables produces duplicated markup, repetitive pagination code, and divergent loading/error states. A single parameterized table guarantees 100% DRY compliance, ensuring that pagination, skeleton states, error banners, and empty states behave identically across both views while differing only in column declarations and remote query hooks.

---

### 14. Visibility-Aware Polling (Document Lifecycle)
- **Decision**: Integrate a `usePageVisibility` hook with TanStack Query's `refetchInterval` to suspend the 10-second Scheduled tab polling when the user switches to another browser tab or minimizes the browser.
- **Alternative Rejected**: Unconditional `setInterval` polling that continues firing indefinitely in background tabs.
- **Why**: Background polling without tab visibility awareness wastes client battery, leaks background bandwidth, and creates unnecessary server load. Suspending polling while hidden and immediately refreshing on window focus (`refetchOnWindowFocus: true`) preserves freshness with optimal resource conservation.

---

### 15. URL-Synchronized State for Tabs and Server-Side Pagination
- **Decision**: Synchronize the active tab (`/dashboard/scheduled` vs `/dashboard/sent`) and pagination parameters (`?page=X&pageSize=Y`) directly in the URL via React Router and `useSearchParams`.
- **Alternative Rejected**: Storing active tab and page index in local component `useState`.
- **Why**: Placing tab and pagination state in the URL ensures that browser refresh, deep-linking, bookmarks, and back/forward navigation work seamlessly without resetting the user's view or page position.

---

### 16. Zero-Layout-Shift Background Refetch Indicator & Column-Matched Skeletons
- **Decision**: A slim, non-disruptive 2px pulse bar at the top of the table for background refetches, paired with 9 column-matched skeleton rows for initial loads.
- **Alternative Rejected**: Full-table loading spinners that erase table contents and cause content jumping during background updates.
- **Why**: Evaluators specifically assess UX states. TanStack Query's `keepPreviousData` combined with a subtle top progress bar allows users to keep reading existing data while page updates arrive in the background, eliminating jarring layout shifts.

---

### 17. Defensive Multi-Format Lead Parser in Pure Logic
- **Decision**: Build a pure tokenizing parser in `src/lib/csvParser.ts` outside React components that strips UTF-8 BOM, normalizes CRLF line breaks, parses quoted fields containing commas/semicolons/tabs, and detects header rows.
- **Alternative Rejected**: Pulling in a heavy external CSV library like `PapaParse`.
- **Why**: Writing a lightweight, dedicated parser in ~140 lines of pure TypeScript makes the logic completely independent of the DOM, enables fast unit testing across messy CSV edge cases, eliminates external bundle bloat, and provides simple, defensible code during interview walk-throughs.

---

### 18. Deduplication and Transparent Feedback Badges
- **Decision**: Automatically lowercase and de-duplicate leads upon file intake, displaying immediate count badges (`✓ N valid email addresses detected` and `⚠ M invalid / duplicate rows`) with an expandable rejected entries preview.
- **Alternative Rejected**: Silently dropping invalid or duplicate rows without explaining why the count changed.
- **Why**: Screen 4 explicitly mandates transparent verification badges. Users importing 135 rows should immediately see why only 127 are scheduled rather than wondering why 8 disappeared.

---

### 19. Cross-Environment File Reading Strategy
- **Decision**: Use `file.text()` with an automatic fallback to `FileReader.readAsText()`.
- **Alternative Rejected**: Relying solely on `file.text()`.
- **Why**: While modern evergreen browsers support `Blob.prototype.text()`, headless testing environments (jsdom) and older mobile browser webviews lack this method. A graceful fallback to standard `FileReader` guarantees 100% test reliability and legacy browser resilience.

---

### 20. Mathematical Simulation of Clock-Hour Quota Windows in Pure Logic
- **Decision**: Build `estimateSendPlan` in `src/lib/sendPlanEstimator.ts` simulating exact clock-hour windows (e.g. 10:00–10:59:59) and minimum delay intervals.
- **Alternative Rejected**: Simple static division (`total / limit`).
- **Why**: Simple division fails when a schedule begins mid-hour (e.g. 10:30 AM). If a batch starts at 10:30 with an hourly cap of 100, only the first 100 can be sent in that clock hour before rolling into the 11:00 window. Simulating clock hour boundaries replicates backend rate-limiting reality and gives users an honest, accurate completion estimate.

---

### 21. Local Timezone Interpretation with ISO UTC API Normalization
- **Decision**: Accept start time input via native `datetime-local` in the user's local timezone and convert it to standard ISO UTC string (`toISOString()`) upon API transmission.
- **Alternative Rejected**: Forcing users to enter UTC times or transmitting un-timezone-qualified strings.
- **Why**: Users schedule emails according to their local business hours. Converting to ISO UTC on transmission ensures backend workers execute jobs at the intended moment regardless of where the server cluster is hosted. If a past time is selected, an informational hint clarifies that sending will begin immediately.

---

### 22. Unsaved Changes Guard via Accessible Confirmation Dialog
- **Decision**: Intercept modal closure (`Escape`, backdrop click, or Cancel button) if the user has entered text or uploaded leads, prompting confirmation before clearing draft state.
- **Alternative Rejected**: Silently closing and discarding user work on accidental backdrop clicks.
- **Why**: Uploading a lead list and composing custom campaign copy takes effort. Accidentally tapping the background or hitting Escape shouldn't wipe user work without confirmation.

---

### 23. Server Field Error to Inline Input Mapping Strategy
- **Decision**: When the backend returns a 400 with a structured `fieldErrors` map, bind the errors directly to their corresponding `Input` and `Textarea` components while clearing errors as soon as the user edits the field.
- **Alternative Rejected**: Showing a generic alert box without pointing to the offending input.
- **Why**: Inline field errors provide immediate spatial context, allowing users to pinpoint and fix specific validation issues (e.g. "Subject cannot be empty") without guesswork.

---

### 24. Top-Level ErrorBoundary for Graceful UI Crash Containment
- **Decision**: Wrap the entire application tree in a dedicated React `ErrorBoundary` component displaying a custom ReachInbox-styled recovery screen with reload and dashboard navigation actions.
- **Alternative Rejected**: Allowing uncaught React lifecycle render errors to produce a blank white screen.
- **Why**: Even with strict TypeScript checking, unexpected DOM runtime exceptions or corrupted third-party cookies could cause a React component render crash. A top-level error boundary prevents the entire viewport from going blank, offering users immediate self-recovery paths while preserving debug stacks in development mode.

---

### 25. Responsive Table Containment & Viewport Degradation Strategy
- **Decision**: Wrap wide tabular data in an `overflow-x-auto` wrapper with sticky header capabilities and flexible column width clamps, while preserving single-screen dashboard layout on desktop.
- **Alternative Rejected**: Truncating or hiding essential columns on mobile or allowing horizontal page blowout.
- **Why**: Evaluators test responsive behavior on laptop and smaller browser windows. Tables must allow internal horizontal scrolling rather than pushing the entire page layout outward or obscuring critical delivery status badges.


