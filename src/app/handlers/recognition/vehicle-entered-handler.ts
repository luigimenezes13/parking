import { inject, injectable } from 'inversify';

import {
  type RecognitionEventPayload,
  type VehicleEnteredEventPayload,
} from '@app/messaging/recognition-event-payload.ts';
import { type RegisterVehicleEntryAppService } from '@app/services/parking/register-vehicle-entry.app-service.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class VehicleEnteredHandler {
  private readonly service: RegisterVehicleEntryAppService;

  constructor(
    @inject(TYPES.RegisterVehicleEntryAppService) service: RegisterVehicleEntryAppService,
  ) {
    this.service = service;
  }

  async handle(payload: RecognitionEventPayload): Promise<void> {
    if (payload.event !== 'vehicle.entered') {
      throw new Error(`VehicleEnteredHandler received unexpected event "${payload.event}".`);
    }

    const concrete = payload as VehicleEnteredEventPayload;
    await this.service.execute({
      plate: concrete.plate,
      entryAt: new Date(concrete.timestamp),
    });
  }
}
