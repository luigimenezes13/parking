import { type Container } from 'inversify';

import { HealthController } from '@infra/controllers/HealthController.ts';
import { RecognitionEventsController } from '@infra/controllers/RecognitionEventsController.ts';
import { DriverController } from '@infra/controllers/driver-controller.ts';

export function configureControllers(container: Container): void {
  container.bind<HealthController>(HealthController).toSelf().inTransientScope();
  container
    .bind<RecognitionEventsController>(RecognitionEventsController)
    .toSelf()
    .inTransientScope();
  container.bind<DriverController>(DriverController).toSelf().inTransientScope();
}
