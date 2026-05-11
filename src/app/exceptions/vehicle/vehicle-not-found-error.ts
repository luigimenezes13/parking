export class VehicleNotFoundError extends Error {
  constructor(vehicleId: string) {
    super(`Vehicle ${vehicleId} was not found.`);
    this.name = 'VehicleNotFoundError';
  }
}
