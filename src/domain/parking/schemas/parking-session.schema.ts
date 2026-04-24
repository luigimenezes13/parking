import { z } from 'zod';

export const sessionStatusSchema = z.enum(['ACTIVE', 'FINISHED']);

export const parkingSessionSchema = z
  .object({
    id: z.string().uuid(),
    vehicleId: z.string().uuid(),
    spotId: z.string().uuid(),
    entryAt: z.date(),
    exitAt: z.date().nullable(),
    status: sessionStatusSchema,
  })
  .refine(
    (session) => (session.status === 'ACTIVE' ? session.exitAt === null : session.exitAt !== null),
    { message: 'exitAt must be set when status is FINISHED and null when ACTIVE' },
  );

export type ParkingSessionSchema = z.infer<typeof parkingSessionSchema>;
export type SessionStatusSchema = z.infer<typeof sessionStatusSchema>;
