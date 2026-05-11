import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const RegisterVehicleRequestSchema = z.object({
  driverId: z.uuid().nullable().optional(),
  parkingLotId: z.uuid(),
  licensePlate: z.string().min(7).max(8),
  brand: z.string().min(1).nullable().optional(),
  model: z.string().min(1).nullable().optional(),
  color: z.string().min(1).nullable().optional(),
});

export type RegisterVehicleRequestDTO = z.infer<typeof RegisterVehicleRequestSchema>;

export class RegisterVehicleRequest extends RequestDto<RegisterVehicleRequestDTO> {
  constructor(input: RegisterVehicleRequestDTO) {
    super(input, RegisterVehicleRequestSchema);
  }
}
