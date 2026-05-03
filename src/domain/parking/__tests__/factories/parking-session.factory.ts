import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

export interface MakeActiveSessionOverrides {
  parkingLotId?: UniqueIdentifier;
  vehicle?: Vehicle | null;
  entryAt?: Date;
}

const DEFAULT_PARKING_LOT_ID = UniqueIdentifier.fromExisting(
  '11111111-1111-4111-8111-111111111111',
);

export function makeActiveSession(overrides: MakeActiveSessionOverrides = {}): ParkingSession {
  const parkingLotId = overrides.parkingLotId ?? DEFAULT_PARKING_LOT_ID;
  const vehicle =
    overrides.vehicle === null ? null : (overrides.vehicle ?? makeVehicle({ parkingLotId }));

  const session = ParkingSession.enter({
    parkingLotId,
    vehicle,
    entryAt: overrides.entryAt ?? new Date('2026-04-30T10:00:00Z'),
  });
  session.pullDomainEvents();
  return session;
}
