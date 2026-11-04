# Chamnay

A phone-friendly budget planner prototype for students. The dashboard includes expense entry, editing, deletion, and a monthly spending summary.

## Stack

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- shadcn/ui component conventions, with app-owned components in `src/components/ui`

## Requirements

Use Node.js 20.19 or newer (or 22.12 or newer) and npm.

## Getting started

```sh
npm install
npm run dev
```

## Checks

```sh
npm run typecheck
npm test
npm run lint
npm run build
```

The dashboard starts with sample figures and transactions in `src/data/demo.ts`. Entry changes are saved in this browser's local storage and affect the displayed balance and monthly spending total. There is no account or server sync.
