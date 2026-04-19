import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '../parking-session.ts';
import { type VehicleEntered } from './vehicle-entered.ts';

export const vehicleEnteredMapper: DomainEventMapper<ParkingSession> = {
  toEvent(session: ParkingSession): VehicleEntered {
    return Object.freeze({
      eventName: 'parking.session.vehicle-entered',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        licensePlate: session.licensePlate().value(),
        spotCode: session.spotCode().value(),
        entryAt: session.entryAt(),
      }),
    });
  },
};
