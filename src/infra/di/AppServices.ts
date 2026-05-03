import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { RegisterVehicleEntryAppService } from '@app/services/parking/register-vehicle-entry.app-service.ts';
import { RegisterSpotOccupationAppService } from '@app/services/parking/register-spot-occupation.app-service.ts';
import { RegisterSpotReleaseAppService } from '@app/services/parking/register-spot-release.app-service.ts';
import { FinishParkingSessionAppService } from '@app/services/parking/finish-parking-session.app-service.ts';
import { VehicleEnteredHandler } from '@app/handlers/recognition/vehicle-entered-handler.ts';
import { SpotOccupiedHandler } from '@app/handlers/recognition/spot-occupied-handler.ts';
import { SpotReleasedHandler } from '@app/handlers/recognition/spot-released-handler.ts';
import { VehicleExitedHandler } from '@app/handlers/recognition/vehicle-exited-handler.ts';

export function configureAppServices(container: Container): void {
  container
    .bind<RegisterVehicleEntryAppService>(TYPES.RegisterVehicleEntryAppService)
    .to(RegisterVehicleEntryAppService)
    .inSingletonScope();

  container
    .bind<RegisterSpotOccupationAppService>(TYPES.RegisterSpotOccupationAppService)
    .to(RegisterSpotOccupationAppService)
    .inSingletonScope();

  container
    .bind<RegisterSpotReleaseAppService>(TYPES.RegisterSpotReleaseAppService)
    .to(RegisterSpotReleaseAppService)
    .inSingletonScope();

  container
    .bind<FinishParkingSessionAppService>(TYPES.FinishParkingSessionAppService)
    .to(FinishParkingSessionAppService)
    .inSingletonScope();

  container
    .bind<VehicleEnteredHandler>(TYPES.VehicleEnteredHandler)
    .to(VehicleEnteredHandler)
    .inSingletonScope();

  container
    .bind<SpotOccupiedHandler>(TYPES.SpotOccupiedHandler)
    .to(SpotOccupiedHandler)
    .inSingletonScope();

  container
    .bind<SpotReleasedHandler>(TYPES.SpotReleasedHandler)
    .to(SpotReleasedHandler)
    .inSingletonScope();

  container
    .bind<VehicleExitedHandler>(TYPES.VehicleExitedHandler)
    .to(VehicleExitedHandler)
    .inSingletonScope();
}
