import { z } from 'zod';

export const parkingLotSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  totalCapacity: z.number().int().positive(),
});

export type ParkingLotSchema = z.infer<typeof parkingLotSchema>;
