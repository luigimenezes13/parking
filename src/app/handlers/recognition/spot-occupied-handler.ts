import { inject, injectable } from 'inversify';

import {
  type RecognitionEventPayload,
  type SpotOccupiedEventPayload,
} from '@app/messaging/recognition-event-payload.ts';
import { type RegisterSpotOccupationAppService } from '@app/services/parking/register-spot-occupation.app-service.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class SpotOccupiedHandler {
  private readonly service: RegisterSpotOccupationAppService;

  constructor(
    @inject(TYPES.RegisterSpotOccupationAppService) service: RegisterSpotOccupationAppService,
  ) {
    this.service = service;
  }

  async handle(payload: RecognitionEventPayload): Promise<void> {
    if (payload.event !== 'spot.occupied') {
      throw new Error(`SpotOccupiedHandler received unexpected event "${payload.event}".`);
    }

    const concrete = payload as SpotOccupiedEventPayload;
    await this.service.execute({
      plate: concrete.plate,
      spotCode: concrete.spot_id,
      confidence: concrete.confidence,
      occupiedAt: new Date(concrete.timestamp),
    });
  }
}
