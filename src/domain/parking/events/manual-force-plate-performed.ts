import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface ManualForcePlatePerformedPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string;
  performedAt: Date;
}

export interface ManualForcePlatePerformed extends DomainEvent<ManualForcePlatePerformedPayload> {
  readonly eventName: 'parking.manual.force-plate-performed';
}

export function createManualForcePlatePerformed(
  payload: ManualForcePlatePerformedPayload,
): ManualForcePlatePerformed {
  return Object.freeze({
    eventName: 'parking.manual.force-plate-performed',
    occurredOn: new Date(),
    payload: Object.freeze({
      sessionId: payload.sessionId,
      parkingLotId: payload.parkingLotId,
      vehicleId: payload.vehicleId,
      licensePlate: payload.licensePlate,
      performedAt: new Date(payload.performedAt.getTime()),
    }),
  });
}
