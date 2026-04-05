import { type Container } from 'inversify';

export function configureServices(_container: Container): void {
  // Bind application services here
  // Example:
  // container
  //   .bind<RegisterVehicleEntryService>(TYPES.RegisterVehicleEntryService)
  //   .to(RegisterVehicleEntryService)
  //   .inTransientScope();
}
