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

