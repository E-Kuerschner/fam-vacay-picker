# Agents

AI guidelines to Claude Code, Cursor and other agents.

## File Organization

- Update `app/routes.ts` whenever adding a new page to the app
- Place routes in `app/routes/`
- Every route should be a folder containing a `route.tsx` and modules specific to that route (e.g. sub-components, util functions, CSS modules, etc.)
- Shared React components should be stored in `app/components/`
- Create reusable components when a pattern emerges _between routes_
- Put reusable services into server modules in `app/server/` with the `.server.ts` extension (e.g. `email.server.ts`)

## Type Safety

React Router generates types for its loaders, actions and other framework-level entities; documentation here: https://reactrouter.com/explanation/type-safety

Import loader and action types from the route's corresponding type module:
```ts
// app/routes/home/route.tsx
import type { Route } from "./+types/route";

// then in the loader
export function loader({ params }: Route.LoaderArgs) {
    // ...
}
```

## Architecture

### Component Library

We use CDS (Coinbase Design System) for it's robust set of reusable components.

CDS usage guidelines here: @.claude/rules/cds.mdc

Use the `cds` MCP Server to help navigate CDS documentation.

CDS component are fully themeable. Docs on that here: https://cds.coinbase.com/getting-started/theming/

### Authentication
The project uses Better Auth for authentication; docs: https://better-auth.com/llms.txt

Better Auth maintains its own database schema for auth concerns. Run `bun db:generate` to generate the necessary database migrations.

The auth Drizzle database schema is generated and found at: `database/authSchema.ts`. This file is merged with the main Drizzle schema file: `database/schema.ts` 

**IMPORTANT** Custom fields on the `users` table MUST ALWAYS be added via the `additionalFields` object in `auth/options.ts` file and NEVER added directly via a custom migration script or by editing the schema files.

### Database
Uses Drizzle ORM with Cloudflare D1 (SQLite). Database schema is defined in `database/schema.ts`.

To generate database migrations, run: `bun db:generate`.

Required environment variables for database:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_DATABASE_ID`
- `CLOUDFLARE_ACCOUNT_TOKEN`

### CSS

This app DOES NOT use Tailwind, Bootstrap nor any other utility-based CSS framework.

Instead, we favor writing modularized, plain CSS in `.css` files for every route.

For example, the home.tsx route should have a corresponding `home.css` file and import it at the top:

```ts
import './home.css';
```

### Animations

For simple state transitions we prefer to use CSS _transitions_.

For complex animations or for spring animations, use `framer-motion`; docs: https://motion.dev/docs/react

## Development Notes
- Ask clarifying questions when working on a complex task
- Use React Router's `Form` component for submiting actions
- Use Coinbase Design Systems' `Box`, `VStack`, `HStack` instead of divs for containers
- Always follow React Router (in Framework mode) best practices
- Use Bun as the package manager and runtime for all scripts
- Cloudflare types are auto-generated via `wrangler types` on postinstall
- React Router types are generated during typecheck
- All file names for React component should be in PascalCase other names (variables, util functions) should be in camelCase
- Prefer using react-router action functions over better-auth authClient methods
- Prefer fetching the user session in the data loader function instead of using better-auth authClient in the components
- By default, perform all data fetching in route loader functions
- Check environments with `import.meta.env.DEV` API, NEVER process.env.NODE_ENV
- NEVER manually create database migrations. ALWAYS relying on the database migration generator script
- NEVER run database migrations files for me. I will always run them when I am ready to.
- Always use `type` over `interface` for Typescript types