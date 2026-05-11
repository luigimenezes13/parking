import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const ForcePlateSessionRequestSchema = z.object({
  plate: z.string().min(7).max(8),
});

export type ForcePlateSessionRequestDTO = z.infer<typeof ForcePlateSessionRequestSchema> & {
  sessionId: string;
};

export class ForcePlateSessionRequest extends RequestDto<ForcePlateSessionRequestDTO> {
  constructor(input: ForcePlateSessionRequestDTO) {
    super(input, ForcePlateSessionRequestSchema);
  }
}
