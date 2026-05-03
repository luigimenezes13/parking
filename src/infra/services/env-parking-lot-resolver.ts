import { injectable } from 'inversify';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { loadEnvironment } from '@infra/env/environment.ts';

@injectable()
export class EnvParkingLotResolver implements ParkingLotResolver {
  private readonly defaultLot: UniqueIdentifier;

  constructor() {
    const environment = loadEnvironment();
    this.defaultLot = UniqueIdentifier.fromExisting(environment.DEFAULT_PARKING_LOT_ID);
  }

  resolveDefault(): UniqueIdentifier {
    return this.defaultLot;
  }
}
