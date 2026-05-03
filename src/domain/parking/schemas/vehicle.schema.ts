import { z } from 'zod';

export const vehicleSchema = z.object({
  id: z.uuid(),
  driverId: z.uuid().nullable(),
  parkingLotId: z.uuid(),
  licensePlate: z.string().min(7).max(8),
  brand: z.string().min(1).nullable(),
  model: z.string().min(1).nullable(),
  color: z.string().min(1).nullable(),
});

export type VehicleSchema = z.infer<typeof vehicleSchema>;
