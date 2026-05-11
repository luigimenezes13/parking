import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const UpdateParkingLotInfoRequestSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  totalCapacity: z.number().int().positive(),
});

export type UpdateParkingLotInfoRequestDTO = z.infer<typeof UpdateParkingLotInfoRequestSchema> & {
  parkingLotId: string;
};

export class UpdateParkingLotInfoRequest extends RequestDto<UpdateParkingLotInfoRequestDTO> {
  constructor(input: UpdateParkingLotInfoRequestDTO) {
    super(input, UpdateParkingLotInfoRequestSchema);
  }
}
