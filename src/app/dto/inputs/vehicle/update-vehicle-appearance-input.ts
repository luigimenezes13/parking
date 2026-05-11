import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const UpdateVehicleAppearanceRequestSchema = z.object({
  brand: z.string().min(1).nullable(),
  model: z.string().min(1).nullable(),
  color: z.string().min(1).nullable(),
});

export type UpdateVehicleAppearanceRequestDTO = z.infer<
  typeof UpdateVehicleAppearanceRequestSchema
> & {
  vehicleId: string;
};

export class UpdateVehicleAppearanceRequest extends RequestDto<UpdateVehicleAppearanceRequestDTO> {
  constructor(input: UpdateVehicleAppearanceRequestDTO) {
    super(input, UpdateVehicleAppearanceRequestSchema);
  }
}
