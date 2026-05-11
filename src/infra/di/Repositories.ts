import { type Container } from 'inversify';
import { type Kysely } from 'kysely';

import { TYPES } from '@app/dto/types.ts';
import { type Database, database } from '@infra/database/Connection.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { KyselyDriverRepository } from '@infra/database/kysely/repositories/kysely-driver-repository.ts';
import { KyselyParkingLotRepository } from '@infra/database/kysely/repositories/kysely-parking-lot-repository.ts';
import { KyselyParkingSpotRepository } from '@infra/database/kysely/repositories/kysely-parking-spot-repository.ts';
import { KyselyVehicleRepository } from '@infra/database/kysely/repositories/kysely-vehicle-repository.ts';
import { KyselyParkingSessionRepository } from '@infra/database/kysely/repositories/kysely-parking-session-repository.ts';

export function configureRepositories(container: Container): void {
  container.bind<Kysely<Database>>(TYPES.Database).toConstantValue(database);

  container
    .bind<DriverRepository>(TYPES.DriverRepository)
    .to(KyselyDriverRepository)
    .inSingletonScope();

  container
    .bind<ParkingLotRepository>(TYPES.ParkingLotRepository)
    .to(KyselyParkingLotRepository)
    .inSingletonScope();

  container
    .bind<ParkingSpotRepository>(TYPES.ParkingSpotRepository)
    .to(KyselyParkingSpotRepository)
    .inSingletonScope();

  container
    .bind<VehicleRepository>(TYPES.VehicleRepository)
    .to(KyselyVehicleRepository)
    .inSingletonScope();

  container
    .bind<ParkingSessionRepository>(TYPES.ParkingSessionRepository)
    .to(KyselyParkingSessionRepository)
    .inSingletonScope();
}
