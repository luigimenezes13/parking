import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { HealthController } from '@infra/controllers/HealthController.ts';
import { RecognitionEventsController } from '@infra/controllers/RecognitionEventsController.ts';
import { DriverController } from '@infra/controllers/driver-controller.ts';
import { ParkingLotController } from '@infra/controllers/parking-lot-controller.ts';
import { VehicleController } from '@infra/controllers/vehicle-controller.ts';
import { ParkingSpotController } from '@infra/controllers/parking-spot-controller.ts';
import { ParkingSessionController } from '@infra/controllers/parking-session-controller.ts';

export function configureControllers(container: Container): void {
  container.bind(TYPES.Controller).to(HealthController).inTransientScope();
  container.bind(TYPES.Controller).to(RecognitionEventsController).inTransientScope();
  container.bind(TYPES.Controller).to(DriverController).inTransientScope();
  container.bind(TYPES.Controller).to(ParkingLotController).inTransientScope();
  container.bind(TYPES.Controller).to(VehicleController).inTransientScope();
  container.bind(TYPES.Controller).to(ParkingSpotController).inTransientScope();
  container.bind(TYPES.Controller).to(ParkingSessionController).inTransientScope();
}
