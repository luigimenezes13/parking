import { z } from 'zod';

export const sessionStatusSchema = z.enum(['ACTIVE', 'FINISHED']);

export const parkingSessionSchema = z
  .object({
    id: z.uuid(),
    vehicleId: z.uuid(),
    spotId: z.uuid().nullable(),
    entryAt: z.date(),
    spotReleasedAt: z.date().nullable(),
    exitAt: z.date().nullable(),
    status: sessionStatusSchema,
  })
  .refine(
    (session) => (session.status === 'ACTIVE' ? session.exitAt === null : session.exitAt !== null),
    { message: 'exitAt must be set when status is FINISHED and null when ACTIVE' },
  );

export type ParkingSessionSchema = z.infer<typeof parkingSessionSchema>;
export type SessionStatusSchema = z.infer<typeof sessionStatusSchema>;
