import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import { loadEnvironment } from '../env/environment.ts';

const environment = loadEnvironment();

export const database = new Kysely<Record<string, unknown>>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      database: environment.DB_NAME,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
      max: environment.DB_MAX_POOL_SIZE,
    }),
  }),
});
