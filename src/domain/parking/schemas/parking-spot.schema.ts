import { z } from 'zod';

export const spotStatusSchema = z.enum(['FREE', 'OCCUPIED', 'RESERVED']);
export const spotTypeSchema = z.enum([
  'REGULAR',
  'COMPACT',
  'LARGE',
  'MOTORCYCLE',
  'ACCESSIBLE',
  'ELECTRIC',
]);

export const parkingSpotSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  code: z.string().min(1).max(16),
  floor: z.number().int(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  isCovered: z.boolean(),
  spotType: spotTypeSchema,
  status: spotStatusSchema,
});

export type ParkingSpotSchema = z.infer<typeof parkingSpotSchema>;
export type SpotStatusSchema = z.infer<typeof spotStatusSchema>;
export type SpotTypeSchema = z.infer<typeof spotTypeSchema>;
