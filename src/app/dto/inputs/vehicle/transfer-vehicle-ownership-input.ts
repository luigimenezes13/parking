import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const TransferVehicleOwnershipRequestSchema = z.object({
  newDriverId: z.uuid(),
});

export type TransferVehicleOwnershipRequestDTO = z.infer<
  typeof TransferVehicleOwnershipRequestSchema
> & {
  vehicleId: string;
};

export class TransferVehicleOwnershipRequest extends RequestDto<TransferVehicleOwnershipRequestDTO> {
  constructor(input: TransferVehicleOwnershipRequestDTO) {
    super(input, TransferVehicleOwnershipRequestSchema);
  }
}
