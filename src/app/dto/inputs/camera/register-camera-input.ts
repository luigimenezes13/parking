import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const RegisterCameraRequestSchema = z.object({
  name: z.string().min(2).max(80),
  streamUrl: z.string().url(),
});

export type RegisterCameraRequestDTO = z.infer<typeof RegisterCameraRequestSchema> & {
  parkingLotId: string;
};

export class RegisterCameraRequest extends RequestDto<RegisterCameraRequestDTO> {
  constructor(input: RegisterCameraRequestDTO) {
    super(input, RegisterCameraRequestSchema);
  }
}
