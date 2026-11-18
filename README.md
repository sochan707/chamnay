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

Home and Spending use the same transaction ledger. Adding, editing, or deleting an expense on either page updates both pages' monthly spending totals and the Home balance. The prototype starts with sample transactions in `src/data/demo.ts` and saves changes in this browser's local storage. There is no account or server sync.
