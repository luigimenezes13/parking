import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env before running Prisma.');
}

export default defineConfig({
  schema: './src/infra/database/prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
