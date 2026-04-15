# Budget Webview App

Starter project for a personal budgeting app for iPhone webview/PWA.

## Stack
- Vue 3
- Vite
- TypeScript
- Pinia
- Dexie (IndexedDB)
- GitLab Pages

## What is included
- Mobile-first shell
- Month switcher in header
- Auto-create current month on app start
- Accounts and categories seed
- Incomes page
- Expenses page
- Settings with JSON export
- GitLab CI config for Pages

## Local launch
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
```

## GitLab upload
1. Create a new empty project in GitLab.
2. Upload all files from this folder to the repository root.
3. Commit to the `main` branch.
4. Open **Build > Pipelines** and wait for the Pages job.
5. Open **Deploy > Pages** to get the app URL.

## Recommended next steps
- Add delete/edit for incomes and expenses.
- Add import from backup JSON.
- Add charts and category analytics.
- Add month carry-over rules.
- Add schema migrations when the DB changes.
