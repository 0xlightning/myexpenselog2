# Technology Architecture Spec

## 1. Overview

This project (`myexpense-log`) is a single-page React application. GitHub's role is **CI/CD only** — it hosts the source code and runs the build/deploy pipeline via GitHub Actions. It is not part of the application's runtime or user-facing authentication.

**App stack:**
- **Frontend:** React (SPA)
- **State management:** Redux (Redux Toolkit recommended)
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui
- **Hosting:** Firebase Hosting
- **Database:** Firestore
- **Authentication:** Firebase Authentication (email/password, client-side)

**Constraint: free-tier only** for Firebase (free plan — no paid upgrade, no Cloud Functions, no Cloud Run).

This combination — plain React, Firebase Hosting, Firebase Authentication, Firestore — is the free-tier-native stack: everything runs client-side in the browser, with no server runtime required anywhere.

---

## 2. System Components

### CI/CD Pipeline (GitHub)
- **Repository** — holds the React app source code.
- **GitHub Actions workflow** — runs build/lint/test steps on push and PR, and deploys the built static output to Firebase Hosting.
- GitHub has no runtime role once the site is deployed — it is CI/CD infrastructure only.

### Application
- **React (SPA)** — built with Create React App (CRA), producing static HTML/JS/CSS.
- **Firebase Hosting** — serves the built static site (free plan).
- **Firebase Authentication** — handles user sign-in (email/password) entirely client-side via the Firebase JS SDK.
- **Firestore** — primary data store, accessed directly from the browser via the Firebase client SDK.

---

## 3. Website Architecture

- **Frontend:** React SPA, built as a static bundle and served directly by Firebase Hosting.
- **State management:** Redux (Redux Toolkit) manages client-side app state — e.g. current user session state mirrored from Firebase Auth, cached Firestore data, UI state. Firebase Auth/Firestore remain the source of truth; Redux holds a synced client-side copy for the UI to read from.
- **UI/Design system:** Tailwind CSS for utility-first styling, with shadcn/ui as the component library (built on Radix primitives + Tailwind). Design tokens (colors, radius) are defined as CSS custom properties in `:root` / `.dark` — see Section 3a below.
- **Auth layer:** Firebase Authentication, email/password provider. Sign-up/sign-in/sign-out handled client-side via the Firebase SDK; the SDK manages session persistence (tokens) in the browser.
- **Data layer:** Firestore, accessed directly from the client using the authenticated user's Firebase Auth identity. Real-time updates available via `onSnapshot` listeners if needed.
- **Access control:** since there is no backend server, **Firestore Security Rules are the sole enforcement layer** — every rule must reference `request.auth.uid` to scope reads/writes to the signed-in user's own data.

### 3a. Design Tokens

Theme is defined via CSS custom properties (OKLCH color space), consumed by Tailwind and shadcn/ui components. Both light (`:root`) and dark (`.dark`) modes are defined, so dark-mode support should be treated as in-scope for the UI, not an afterthought.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.147 0.004 49.3);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.147 0.004 49.3);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.147 0.004 49.3);
  --primary: oklch(0.496 0.265 301.924);
  --primary-foreground: oklch(0.977 0.014 308.299);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.96 0.002 17.2);
  --muted-foreground: oklch(0.547 0.021 43.1);
  --accent: oklch(0.496 0.265 301.924);
  --accent-foreground: oklch(0.977 0.014 308.299);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0.005 34.3);
  --input: oklch(0.922 0.005 34.3);
  --ring: oklch(0.714 0.014 41.2);
  --chart-1: oklch(0.845 0.143 164.978);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.596 0.145 163.225);
  --chart-4: oklch(0.508 0.118 165.612);
  --chart-5: oklch(0.432 0.095 166.913);
  --radius: 0.45rem;
  --sidebar: oklch(0.986 0.002 67.8);
  --sidebar-foreground: oklch(0.147 0.004 49.3);
  --sidebar-primary: oklch(0.558 0.288 302.321);
  --sidebar-primary-foreground: oklch(0.977 0.014 308.299);
  --sidebar-accent: oklch(0.96 0.002 17.2);
  --sidebar-accent-foreground: oklch(0.214 0.009 43.1);
  --sidebar-border: oklch(0.922 0.005 34.3);
  --sidebar-ring: oklch(0.714 0.014 41.2);
}
.dark {
  --background: oklch(0.147 0.004 49.3);
  --foreground: oklch(0.986 0.002 67.8);
  --card: oklch(0.214 0.009 43.1);
  --card-foreground: oklch(0.986 0.002 67.8);
  --popover: oklch(0.214 0.009 43.1);
  --popover-foreground: oklch(0.986 0.002 67.8);
  --primary: oklch(0.438 0.218 303.724);
  --primary-foreground: oklch(0.977 0.014 308.299);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.268 0.011 36.5);
  --muted-foreground: oklch(0.714 0.014 41.2);
  --accent: oklch(0.438 0.218 303.724);
  --accent-foreground: oklch(0.977 0.014 308.299);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.547 0.021 43.1);
  --chart-1: oklch(0.845 0.143 164.978);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.596 0.145 163.225);
  --chart-4: oklch(0.508 0.118 165.612);
  --chart-5: oklch(0.432 0.095 166.913);
  --sidebar: oklch(0.214 0.009 43.1);
  --sidebar-foreground: oklch(0.986 0.002 67.8);
  --sidebar-primary: oklch(0.627 0.265 303.9);
  --sidebar-primary-foreground: oklch(0.977 0.014 308.299);
  --sidebar-accent: oklch(0.268 0.011 36.5);
  --sidebar-accent-foreground: oklch(0.986 0.002 67.8);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.547 0.021 43.1);
}
```

---

## 4. CI/CD Pipeline Details

- **Purpose:** automate build, lint/test, and deployment whenever code is pushed or a PR is opened.
- **Deployment:** a GitHub Actions workflow builds the React app and deploys the static output to Firebase Hosting, typically via the `FirebaseExtended/action-hosting-deploy` GitHub Action, authenticated with a Firebase service account token.
- **Secret storage:** the Firebase service account token (and any other CI-time secrets) are stored as GitHub repository secrets (Settings → Secrets and variables → Actions), encrypted at rest.
- **Requirement:** repository access to configure the deploy workflow and secrets.

---

## 5. Permissions Model

### GitHub Actions (CI/CD only)
- Repo-scoped workflow permissions, minimum required for build/deploy steps (e.g. `contents: read`).
- The Firebase service account used for deployment should be scoped to Hosting deploy permissions only — not broader project-owner access.

### Firestore
- Security rules must be scoped **per authenticated user**, referencing `request.auth.uid` (populated by Firebase Authentication).
- Default-open rules (`allow read, write: if true;`) must never be used in production.
- Because all data access happens client-side with no server to mediate it, rules must be written defensively and tested — there is no fallback access-control layer.

---

## 6. Data Flow

### CI/CD Pipeline
```
Push / PR event → GitHub Actions workflow triggers
→ build, lint/test steps run
→ deploy step pushes static output to Firebase Hosting
```

### Live Application
```
User's browser → Firebase Hosting (serves static React build, free plan)
→ Firebase Authentication (client SDK sign-in/sign-up)
→ authenticated client → Firestore (client SDK, access governed entirely by Security Rules)
```

---

## 7. Security Considerations

- Never hardcode the Firebase service account token or any credential in the repository — always reference via GitHub secrets.
- Rotate the Firebase deploy service account token periodically.
- Avoid logging workflow variables that may contain secrets.
- Firestore Security Rules are the only access-control mechanism — they must be explicitly written, reviewed, and tested (e.g. with the Firestore emulator) before go-live.
- Firebase Authentication settings (authorized domains, allowed sign-in methods) should be restricted to the production domain to prevent abuse.
- **Single Firebase project risk:** since dev and production share one Firestore instance, local/dev testing can read or write real user data. Mitigate with clear collection naming (e.g. a `dev_` prefix or separate top-level collections) or by pointing local development at the Firestore emulator instead of the live project.

---

## 8. Resolved Decisions (locked at Phase 0, 2026-07-09)

1. **Build tooling:** Create React App (CRA) — **confirmed by user**, despite archived status. shadcn/ui source must be hand-copied into `src/components/ui/` (no CLI). Manual Tailwind/PostCSS config expected.
2. **Redux scope:** `onSnapshot` listeners feed Redux slices; **no manual dual-sync** of Firestore data.
3. **Firestore free-plan quota awareness:** ~50K reads/day, ~20K writes/day, 1 GiB storage. Data-access patterns must avoid unbounded `onSnapshot` on large collections; paginate or scope by date where applicable. (Still in force — no quota change.)
4. **Password reset / email verification:** **Email verification NOT required for v1.** Password reset is available via Firebase out of the box but not in v1 scope unless surfaced later.
5. **Deploy trigger scope:** **Push to `main` auto-deploys** to Firebase Hosting via GitHub Actions. No tagged-release gate for v1.
6. **Secret rotation cadence:** **TBD** — not a v1 blocker. Re-evaluate at Phase 6.

## 8a. Data layout (locked at Phase 0)

Three separate collections per the data model in `Project-spec.md` §1 — **not** a unified `transactions/` collection. Dashboard reads all three and merges client-side.

## 8b. Entry validation (locked at Phase 0)

Client-side, before any Firestore write: `amount > 0`, `date` parseable. No negative-net-worth warning in v1.
