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
