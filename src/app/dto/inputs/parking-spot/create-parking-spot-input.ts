import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

const spotTypeEnum = z.enum([
  'REGULAR',
  'COMPACT',
  'LARGE',
  'MOTORCYCLE',
  'ACCESSIBLE',
  'ELECTRIC',
]);

export const CreateParkingSpotRequestSchema = z.object({
  code: z.string().min(1).max(16),
  floor: z.number().int(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  isCovered: z.boolean(),
  spotType: spotTypeEnum,
});

export type CreateParkingSpotRequestDTO = z.infer<typeof CreateParkingSpotRequestSchema> & {
  parkingLotId: string;
};

export class CreateParkingSpotRequest extends RequestDto<CreateParkingSpotRequestDTO> {
  constructor(input: CreateParkingSpotRequestDTO) {
    super(input, CreateParkingSpotRequestSchema);
  }
}
