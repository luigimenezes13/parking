import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { ParkingSessionMapper } from '@infra/database/kysely/mappers/parking-session-mapper.ts';
import { DriverMapper } from '@infra/database/kysely/mappers/driver-mapper.ts';
import { ParkingLotMapper } from '@infra/database/kysely/mappers/parking-lot-mapper.ts';

export function configureMappers(container: Container): void {
  container
    .bind<ParkingSpotMapper>(TYPES.ParkingSpotMapper)
    .to(ParkingSpotMapper)
    .inSingletonScope();
  container.bind<VehicleMapper>(TYPES.VehicleMapper).to(VehicleMapper).inSingletonScope();
  container
    .bind<ParkingSessionMapper>(TYPES.ParkingSessionMapper)
    .to(ParkingSessionMapper)
    .inSingletonScope();
  container.bind<DriverMapper>(TYPES.DriverMapper).to(DriverMapper).inSingletonScope();
  container.bind<ParkingLotMapper>(TYPES.ParkingLotMapper).to(ParkingLotMapper).inSingletonScope();
}
