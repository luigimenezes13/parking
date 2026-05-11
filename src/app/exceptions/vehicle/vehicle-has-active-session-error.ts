export class VehicleHasActiveSessionError extends Error {
  constructor(vehicleId: string) {
    super(`Vehicle ${vehicleId} cannot be deactivated because it has an active parking session.`);
    this.name = 'VehicleHasActiveSessionError';
  }
}
