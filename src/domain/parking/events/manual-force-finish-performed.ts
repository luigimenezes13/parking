import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface ManualForceFinishPerformedPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  performedAt: Date;
}

export interface ManualForceFinishPerformed extends DomainEvent<ManualForceFinishPerformedPayload> {
  readonly eventName: 'parking.manual.force-finish-performed';
}

export function createManualForceFinishPerformed(
  payload: ManualForceFinishPerformedPayload,
): ManualForceFinishPerformed {
  return Object.freeze({
    eventName: 'parking.manual.force-finish-performed',
    occurredOn: new Date(),
    payload: Object.freeze({
      sessionId: payload.sessionId,
      parkingLotId: payload.parkingLotId,
      vehicleId: payload.vehicleId,
      performedAt: new Date(payload.performedAt.getTime()),
    }),
  });
}
