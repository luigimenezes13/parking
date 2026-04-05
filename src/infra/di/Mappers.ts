import { type Container } from 'inversify';

export function configureMappers(_container: Container): void {
  // Bind persistence and response mappers here
  // Example:
  // container
  //   .bind<VehiclePersistenceMapper>(VehiclePersistenceMapper)
  //   .toSelf()
  //   .inSingletonScope();
}
