import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '../parking-session.ts';
import { type VehicleExited } from './vehicle-exited.ts';

export interface VehicleExitedContext {
  exitAt: Date;
}

export const vehicleExitedMapper: DomainEventMapper<ParkingSession, VehicleExitedContext> = {
  toEvent(session: ParkingSession, context: VehicleExitedContext): VehicleExited {
    return Object.freeze({
      eventName: 'parking.session.vehicle-exited',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        licensePlate: session.licensePlate().value(),
        spotCode: session.spotCode().value(),
        entryAt: session.entryAt(),
        exitAt: new Date(context.exitAt.getTime()),
      }),
    });
  },
};
