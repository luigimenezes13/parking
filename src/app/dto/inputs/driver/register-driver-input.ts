import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const RegisterDriverRequestSchema = z.object({
  cnh: z.string().min(1).max(11),
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
});

export type RegisterDriverRequestDTO = z.infer<typeof RegisterDriverRequestSchema>;

export class RegisterDriverRequest extends RequestDto<RegisterDriverRequestDTO> {
  constructor(input: RegisterDriverRequestDTO) {
    super(input, RegisterDriverRequestSchema);
  }
}
