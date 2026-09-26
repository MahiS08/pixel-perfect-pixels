# AGENT WORKFLOW

This project is now built and maintained locally.

Do NOT use any Lovable workflows, error boundaries, or sandbox integrations.
All features and components are maintained locally in the repository.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Routing: TanStack Router
- Data fetching: TanStack Query + TanStack Start (createServerFn)
- Backend API: Snowflake SDK

## Snowflake Setup
To connect this application to Snowflake:
1. Set the `.env` variables from `.env.example`
2. Run the `setup-snowflake.js` script to bootstrap the DB.
3. Start the application with `npm run dev`.

The frontend endpoints communicate to Snowflake via `createServerFn` server-side endpoints defined in `src/services/api.ts`.
