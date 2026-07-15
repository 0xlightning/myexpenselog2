# Architecture

Current structure of `website/src/`:

```
src/
├── app/
│   ├── store.js
│   ├── hooks.js
│   └── uiSlice.js
│
├── components/
│   ├── ui/
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   └── skeleton.jsx
│   ├── ErrorToast.jsx
│   ├── OnlineStatusBridge.jsx
│   └── ThemeToggle.jsx
│
├── features/
│   ├── auth/
│   │   ├── authSlice.js
│   │   ├── AuthGate.jsx
│   │   ├── Header.jsx
│   │   └── LoginPage.jsx
│   ├── income/
│   │   └── incomeSlice.js
│   ├── expenditure/
│   │   └── expenditureSlice.js
│   ├── investments/
│   │   └── investmentsSlice.js
│   ├── records/
│   │   ├── kindMeta.js
│   │   └── RecordPage.jsx
│   └── dashboard/
│       ├── derive.js
│       └── Dashboard.jsx
│
├── lib/
│   ├── auth.js
│   ├── dates.js
│   ├── firebase.js
│   ├── firestore.js
│   ├── utils.js
│   └── validation.js
│
├── styles/
│   ├── index.css
│   └── tokens.css
│
├── App.js
├── App.css
├── App.test.js
├── index.js
├── index.css
├── logo.svg
├── reportWebVitals.js
└── setupTests.js
```

## Notes

- `app/` — Redux store + UI slice.
- `components/ui/` — shadcn-style primitives (hand-copied, not CLI).
- `components/` — shared cross-feature UI (toasts, theme toggle, online bridge).
- `features/` — domain modules; each owns its slice + page components.
- `lib/` — infrastructure: Firebase init, auth helpers, validation, date utils.
- `styles/` — global CSS + OKLCH token definitions (`tokens.css`).
- Root files — CRA boilerplate (App.js, index.js, reportWebVitals). Tailwind v3 + Vite migration target.

## Intended target structure (not yet applied)

```
src/
├── app/
├── components/
│   ├── ui/          # shadcn primitives
│   ├── layout/      # shell, nav, sidebar
│   └── shared/      # cross-feature widgets
├── features/
│   ├── auth/
│   ├── income/
│   ├── expenditure/
│   ├── investments/
│   └── dashboard/
├── hooks/           # global custom hooks
├── lib/
│   ├── firebase/    # init + per-collection helpers
│   ├── utils/
│   └── constants/
├── services/        # external integrations (Firestore wrappers, etc.)
├── pages/           # route-level components
├── styles/
└── assets/          # images, fonts, static
```
