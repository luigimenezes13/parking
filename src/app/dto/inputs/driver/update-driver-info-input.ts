import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const UpdateDriverInfoRequestSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
});

export type UpdateDriverInfoRequestDTO = z.infer<typeof UpdateDriverInfoRequestSchema> & {
  driverId: string;
};

export class UpdateDriverInfoRequest extends RequestDto<UpdateDriverInfoRequestDTO> {
  constructor(input: UpdateDriverInfoRequestDTO) {
    super(input, UpdateDriverInfoRequestSchema);
  }
}
