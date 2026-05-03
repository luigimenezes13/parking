import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { ParkingSessionMapper } from '@infra/database/kysely/mappers/parking-session-mapper.ts';

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
}
