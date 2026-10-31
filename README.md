# Chamnay

A phone-friendly budget planner prototype for students. This repository currently contains the frontend app shell and a sample overview dashboard.

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
npm run lint
npm run build
```

Dashboard figures and transactions are sample data in `src/data/demo.ts`. The app does not store personal financial data. Browser storage may be added with transaction entry in a later prototype step.
