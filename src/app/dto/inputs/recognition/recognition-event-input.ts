import { z } from 'zod/v4';

import { RequestDto } from '@infra/http/request-dto.ts';

const baseSchema = z.object({
  plate: z.string().nullable(),
  timestamp: z.iso.datetime({ offset: true }),
});

const vehicleEnteredSchema = baseSchema.extend({
  event: z.literal('vehicle.entered'),
});

const spotOccupiedSchema = baseSchema.extend({
  event: z.literal('spot.occupied'),
  spot_id: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const spotReleasedSchema = baseSchema.extend({
  event: z.literal('spot.released'),
  spot_id: z.string().min(1),
});

const vehicleExitedSchema = baseSchema.extend({
  event: z.literal('vehicle.exited'),
});

export const RecognitionEventRequestSchema = z.discriminatedUnion('event', [
  vehicleEnteredSchema,
  spotOccupiedSchema,
  spotReleasedSchema,
  vehicleExitedSchema,
]);

export type RecognitionEventRequestDTO = z.infer<typeof RecognitionEventRequestSchema>;

export class RecognitionEventRequest extends RequestDto<RecognitionEventRequestDTO> {
  constructor(input: RecognitionEventRequestDTO) {
    super(input, RecognitionEventRequestSchema);
  }
}
