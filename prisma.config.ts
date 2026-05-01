import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './src/infra/database/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
