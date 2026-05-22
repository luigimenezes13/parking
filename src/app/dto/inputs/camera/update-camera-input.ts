import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const UpdateCameraRequestSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  streamUrl: z.string().url().optional(),
});

export type UpdateCameraRequestDTO = z.infer<typeof UpdateCameraRequestSchema> & {
  cameraId: string;
};

export class UpdateCameraRequest extends RequestDto<UpdateCameraRequestDTO> {
  constructor(input: UpdateCameraRequestDTO) {
    super(input, UpdateCameraRequestSchema);
  }
}
