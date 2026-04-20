import { z } from 'zod';

export const driverSchema = z.object({
  id: z.string().uuid(),
  cnh: z.string().min(1).max(11),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

export type DriverSchema = z.infer<typeof driverSchema>;
