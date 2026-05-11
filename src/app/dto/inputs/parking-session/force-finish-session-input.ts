import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

export const ForceFinishSessionRequestSchema = z.object({
  exitAt: z.iso.datetime().optional(),
});

export type ForceFinishSessionRequestDTO = z.infer<typeof ForceFinishSessionRequestSchema> & {
  sessionId: string;
};

export class ForceFinishSessionRequest extends RequestDto<ForceFinishSessionRequestDTO> {
  constructor(input: ForceFinishSessionRequestDTO) {
    super(input, ForceFinishSessionRequestSchema);
  }
}
