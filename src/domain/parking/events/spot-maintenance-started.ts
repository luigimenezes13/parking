import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotMaintenanceStartedPayload {
  spotId: string;
  spotCode: string;
  parkingLotId: string;
  startedAt: Date;
}

export interface SpotMaintenanceStarted extends DomainEvent<SpotMaintenanceStartedPayload> {
  readonly eventName: 'parking.spot.maintenance-started';
}

export function createSpotMaintenanceStarted(
  payload: SpotMaintenanceStartedPayload,
): SpotMaintenanceStarted {
  return Object.freeze({
    eventName: 'parking.spot.maintenance-started',
    occurredOn: new Date(),
    payload: Object.freeze({
      spotId: payload.spotId,
      spotCode: payload.spotCode,
      parkingLotId: payload.parkingLotId,
      startedAt: new Date(payload.startedAt.getTime()),
    }),
  });
}
