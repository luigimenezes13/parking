import { inject, injectable } from 'inversify';

import {
  type RecognitionEventPayload,
  type VehicleExitedEventPayload,
} from '@app/messaging/recognition-event-payload.ts';
import { type FinishParkingSessionAppService } from '@app/services/parking/finish-parking-session.app-service.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class VehicleExitedHandler {
  private readonly service: FinishParkingSessionAppService;

  constructor(
    @inject(TYPES.FinishParkingSessionAppService) service: FinishParkingSessionAppService,
  ) {
    this.service = service;
  }

  async handle(payload: RecognitionEventPayload): Promise<void> {
    if (payload.event !== 'vehicle.exited') {
      throw new Error(`VehicleExitedHandler received unexpected event "${payload.event}".`);
    }

    const concrete = payload as VehicleExitedEventPayload;
    await this.service.execute({
      plate: concrete.plate,
      exitAt: new Date(concrete.timestamp),
    });
  }
}
