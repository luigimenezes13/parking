import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';

export interface ParkingLotResolver {
  resolveDefault(): UniqueIdentifier;
}
