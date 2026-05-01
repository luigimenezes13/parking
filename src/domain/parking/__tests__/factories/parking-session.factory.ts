import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

export interface MakeActiveSessionOverrides {
  vehicle?: Vehicle;
  entryAt?: Date;
}

export function makeActiveSession(overrides: MakeActiveSessionOverrides = {}): ParkingSession {
  const session = ParkingSession.enter({
    vehicle: overrides.vehicle ?? makeVehicle(),
    entryAt: overrides.entryAt ?? new Date('2026-04-30T10:00:00Z'),
  });
  session.pullDomainEvents();
  return session;
}
