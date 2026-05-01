import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import { type DB } from '@infra/database/types/Types.ts';
import { loadEnvironment } from '@infra/env/environment.ts';

const environment = loadEnvironment();

export const database = new Kysely<DB>({
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

export type Database = DB;
