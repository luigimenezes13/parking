import { type Container } from 'inversify';

export function configureRepositories(_container: Container): void {
  // Bind repository implementations here
  // Example:
  // container
  //   .bind<VehicleDomainRepository>(TYPES.VehicleDomainRepository)
  //   .to(VehicleKyselyRepository)
  //   .inSingletonScope();
}
