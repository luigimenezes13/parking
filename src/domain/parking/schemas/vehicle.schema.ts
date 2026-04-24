import { z } from 'zod';

export const vehicleSchema = z.object({
  id: z.uuid(),
  driverId: z.uuid(),
  licensePlate: z.string().min(7).max(8),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export type VehicleSchema = z.infer<typeof vehicleSchema>;
