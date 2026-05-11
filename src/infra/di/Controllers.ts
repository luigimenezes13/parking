import { type Container } from 'inversify';

import { HealthController } from '@infra/controllers/HealthController.ts';
import { RecognitionEventsController } from '@infra/controllers/RecognitionEventsController.ts';
import { DriverController } from '@infra/controllers/driver-controller.ts';
import { ParkingLotController } from '@infra/controllers/parking-lot-controller.ts';

export function configureControllers(container: Container): void {
  container.bind<HealthController>(HealthController).toSelf().inTransientScope();
  container
    .bind<RecognitionEventsController>(RecognitionEventsController)
    .toSelf()
    .inTransientScope();
  container.bind<DriverController>(DriverController).toSelf().inTransientScope();
  container.bind<ParkingLotController>(ParkingLotController).toSelf().inTransientScope();
}
