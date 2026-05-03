import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';

export class StaticParkingLotResolver implements ParkingLotResolver {
  private readonly identifier: UniqueIdentifier;

  constructor(parkingLotId: string = '11111111-1111-4111-8111-111111111111') {
    this.identifier = UniqueIdentifier.fromExisting(parkingLotId);
  }

  resolveDefault(): UniqueIdentifier {
    return this.identifier;
  }
}
