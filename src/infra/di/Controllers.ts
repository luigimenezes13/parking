import { type Container } from 'inversify';

import { HealthController } from '../controllers/HealthController.ts';

export function configureControllers(container: Container): void {
  container
    .bind<HealthController>(HealthController)
    .toSelf()
    .inTransientScope();
}
