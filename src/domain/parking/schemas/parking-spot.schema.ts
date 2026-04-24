import { z } from 'zod';

export const spotStatusSchema = z.enum(['FREE', 'OCCUPIED', 'RESERVED']);

export const parkingSpotSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  code: z.string().min(1).max(16),
  floor: z.number().int(),
  isCovered: z.boolean(),
  status: spotStatusSchema,
});

export type ParkingSpotSchema = z.infer<typeof parkingSpotSchema>;
export type SpotStatusSchema = z.infer<typeof spotStatusSchema>;
