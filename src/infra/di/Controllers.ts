import { type Container } from 'inversify';

import { HealthController } from '@infra/controllers/HealthController.ts';
import { RecognitionEventsController } from '@infra/controllers/RecognitionEventsController.ts';
import { DriverController } from '@infra/controllers/driver-controller.ts';
import { ParkingLotController } from '@infra/controllers/parking-lot-controller.ts';
import { VehicleController } from '@infra/controllers/vehicle-controller.ts';
import { ParkingSpotController } from '@infra/controllers/parking-spot-controller.ts';
import { ParkingSessionController } from '@infra/controllers/parking-session-controller.ts';

export function configureControllers(container: Container): void {
  container.bind<HealthController>(HealthController).toSelf().inTransientScope();
  container
    .bind<RecognitionEventsController>(RecognitionEventsController)
    .toSelf()
    .inTransientScope();
  container.bind<DriverController>(DriverController).toSelf().inTransientScope();
  container.bind<ParkingLotController>(ParkingLotController).toSelf().inTransientScope();
  container.bind<VehicleController>(VehicleController).toSelf().inTransientScope();
  container.bind<ParkingSpotController>(ParkingSpotController).toSelf().inTransientScope();
  container.bind<ParkingSessionController>(ParkingSessionController).toSelf().inTransientScope();
}
