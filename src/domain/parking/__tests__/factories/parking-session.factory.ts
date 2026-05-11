import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

export interface EnterSessionOverrides {
  parkingLotId?: UniqueIdentifier;
  vehicle?: Vehicle | null;
  entryAt?: Date;
}

export type MakeActiveSessionOverrides = EnterSessionOverrides;

const DEFAULT_PARKING_LOT_ID = UniqueIdentifier.fromExisting(
  '11111111-1111-4111-8111-111111111111',
);

const DEFAULT_ENTRY_AT = new Date('2026-04-30T10:00:00Z');

export function enterSession(overrides: EnterSessionOverrides = {}): ParkingSession {
  const parkingLotId = overrides.parkingLotId ?? DEFAULT_PARKING_LOT_ID;
  const vehicle =
    overrides.vehicle === null ? null : (overrides.vehicle ?? makeVehicle({ parkingLotId }));

  return ParkingSession.enter({
    parkingLotId,
    vehicle,
    entryAt: overrides.entryAt ?? DEFAULT_ENTRY_AT,
  });
}

export function makeActiveSession(overrides: MakeActiveSessionOverrides = {}): ParkingSession {
  const session = enterSession(overrides);
  session.pullDomainEvents();
  return session;
}
