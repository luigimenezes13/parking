import 'reflect-metadata';

import { container } from './Container.ts';
import { HealthController } from '../controllers/HealthController.ts';

try {
  container.get(HealthController);
  console.log('DI container is valid. All bindings resolved successfully.');
} catch (error) {
  console.error('DI container validation failed:', error);
  process.exit(1);
}
