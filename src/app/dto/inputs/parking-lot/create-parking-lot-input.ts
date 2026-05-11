import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const CreateParkingLotRequestSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  totalCapacity: z.number().int().positive(),
});

export type CreateParkingLotRequestDTO = z.infer<typeof CreateParkingLotRequestSchema>;

export class CreateParkingLotRequest extends RequestDto<CreateParkingLotRequestDTO> {
  constructor(input: CreateParkingLotRequestDTO) {
    super(input, CreateParkingLotRequestSchema);
  }
}
