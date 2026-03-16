This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Panel Admin

El panel de administración (tipo Django Admin) está en `/admin`. Permite gestionar:

- **Clientes** – listado y alta
- **Planes** – listado y alta (días por semana, descripción)
- **Horarios (slots)** – definición de franjas por día y cupo
- **Reservas** – listado
- **Pagos** – listado
- **Políticas** – claves/valores del estudio

### Backend: Supabase + Drizzle

- Copia `.env.example` a `.env.local` y rellena:
  - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Settings → API)
  - `DATABASE_URL` o `SUPABASE_DATABASE_URL` (connection string de Postgres de Supabase, para Drizzle)

- Migraciones con Drizzle:
  - `npm run db:generate` – genera SQL en `drizzle/`
  - Ejecuta ese SQL en la base de Supabase (SQL Editor o `supabase db push` si usas CLI)
  - `npm run db:studio` – abre Drizzle Studio para inspeccionar datos

- Supabase CLI (ya inicializado con `npx supabase init`):
  - `npx supabase login` y `npx supabase link --project-ref <ref>` para enlazar el proyecto
  - Útil para migraciones locales y despliegue

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


todo:
.env
npm run db:generate
