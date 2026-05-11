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

export const UpdateParkingSpotMetadataRequestSchema = z.object({
  floor: z.number().int(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  isCovered: z.boolean(),
  spotType: spotTypeEnum,
});

export type UpdateParkingSpotMetadataRequestDTO = z.infer<
  typeof UpdateParkingSpotMetadataRequestSchema
> & {
  parkingSpotId: string;
};

export class UpdateParkingSpotMetadataRequest extends RequestDto<UpdateParkingSpotMetadataRequestDTO> {
  constructor(input: UpdateParkingSpotMetadataRequestDTO) {
    super(input, UpdateParkingSpotMetadataRequestSchema);
  }
}
