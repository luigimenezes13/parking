import { inject, injectable } from 'inversify';

import {
  type RecognitionEventPayload,
  type SpotReleasedEventPayload,
} from '@app/messaging/recognition-event-payload.ts';
import { type RegisterSpotReleaseAppService } from '@app/services/parking/register-spot-release.app-service.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class SpotReleasedHandler {
  private readonly service: RegisterSpotReleaseAppService;

  constructor(@inject(TYPES.RegisterSpotReleaseAppService) service: RegisterSpotReleaseAppService) {
    this.service = service;
  }

  async handle(payload: RecognitionEventPayload): Promise<void> {
    if (payload.event !== 'spot.released') {
      throw new Error(`SpotReleasedHandler received unexpected event "${payload.event}".`);
    }

    const concrete = payload as SpotReleasedEventPayload;
    await this.service.execute({
      plate: concrete.plate,
      spotCode: concrete.spot_id,
      releasedAt: new Date(concrete.timestamp),
    });
  }
}
