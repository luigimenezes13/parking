import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type VehicleExited } from '@domain/parking/aggregates/parking-session/events/vehicle-exited.ts';

export interface VehicleExitedContext {
  exitAt: Date;
}

export const vehicleExitedMapper: DomainEventMapper<
  ParkingSession,
  VehicleExited,
  VehicleExitedContext
> = {
  toEvent(session: ParkingSession, context: VehicleExitedContext): VehicleExited {
    return Object.freeze({
      eventName: 'parking.session.vehicle-exited',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        vehicleId: session.vehicle().id().value(),
        licensePlate: session.licensePlate().value(),
        exitAt: new Date(context.exitAt.getTime()),
      }),
    });
  },
};
