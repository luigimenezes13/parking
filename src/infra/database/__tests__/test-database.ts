import { sql } from 'kysely';

import { database } from '@infra/database/Connection.ts';

export async function truncateAllTables(): Promise<void> {
  await sql`
    TRUNCATE TABLE parking_sessions, parking_spots, vehicles, drivers, parking_lots
    RESTART IDENTITY CASCADE
  `.execute(database);
}

export async function disconnectDatabase(): Promise<void> {
  await database.destroy();
}
