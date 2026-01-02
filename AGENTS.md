# Agents

AI guidelines to Claude Code, Cursor and other agents.

## Architecture

### Component Library

We use CDS (Coinbase Design System) for it's robust set of reusable components.

CDS component are fully themeable. Docs on that here: https://cds.coinbase.com/getting-started/theming/

Use CDS documentation for a list of all its components and usage guidelines: https://cds.coinbase.com/llms/web/routes.txt

### CSS

This app DOES NOT use Tailwind, Bootstrap nor any other utility-based CSS framework.

Instead, we favor writing modularized, plain CSS in `.css` files for every route.

For example, the home.tsx route should have a corresponding `home.css` file and import it at the top:

```ts
import './home.css';
```

### Authentication
The project uses Better Auth for authentication. Auth schema generation is integrated with database migrations via `bun run db:generate`.

Custom fields on the `users` table MUST ALWAYS be added via the `additionalFields` object in `auth/options.ts` file and NEVER added directly via a custom migration script or by editing the schema files.

### Database
Uses Drizzle ORM with Cloudflare D1 (SQLite). Database schema is defined in `database/schema.ts`.

Required environment variables for database:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_DATABASE_ID`
- `CLOUDFLARE_ACCOUNT_TOKEN`

## Development Notes
- Ask clarifying questions when working on a complex task
- Always follow React Router (in Framework mode) best practices
- Use Bun as the package manager and runtime for all scripts
- Cloudflare types are auto-generated via `wrangler types` on postinstall
- React Router types are generated during typecheck
- All file names for React component should be in PascalCase other names (variables, util functions) should be in camelCase
- Prefer using react-router action functions over better-auth authClient methods
- Prefer fetching the user session in the data loader function instead of using better-auth authClient in the components
- By default, perform all data fetching in route loader functions
- Update @app/routes.ts whenever adding a new page to the app
- Check environments with `import.meta.env.DEV` API, NEVER process.env.NODE_ENV
- NEVER manually create database migrations. ALWAYS relying on the database migration generator script
- Always use `type` over `interface` for Typescript types