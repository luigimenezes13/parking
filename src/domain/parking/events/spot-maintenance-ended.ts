import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotMaintenanceEndedPayload {
  spotId: string;
  spotCode: string;
  parkingLotId: string;
  endedAt: Date;
}

export interface SpotMaintenanceEnded extends DomainEvent<SpotMaintenanceEndedPayload> {
  readonly eventName: 'parking.spot.maintenance-ended';
}

export function createSpotMaintenanceEnded(
  payload: SpotMaintenanceEndedPayload,
): SpotMaintenanceEnded {
  return Object.freeze({
    eventName: 'parking.spot.maintenance-ended',
    occurredOn: new Date(),
    payload: Object.freeze({
      spotId: payload.spotId,
      spotCode: payload.spotCode,
      parkingLotId: payload.parkingLotId,
      endedAt: new Date(payload.endedAt.getTime()),
    }),
  });
}
