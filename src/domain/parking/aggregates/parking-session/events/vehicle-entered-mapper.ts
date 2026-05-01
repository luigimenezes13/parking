import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type VehicleEntered } from '@domain/parking/aggregates/parking-session/events/vehicle-entered.ts';

export const vehicleEnteredMapper: DomainEventMapper<ParkingSession, VehicleEntered> = {
  toEvent(session: ParkingSession): VehicleEntered {
    return Object.freeze({
      eventName: 'parking.session.vehicle-entered',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        vehicleId: session.vehicle().id().value(),
        licensePlate: session.licensePlate().value(),
        entryAt: session.entryAt(),
      }),
    });
  },
};
