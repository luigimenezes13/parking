export class SpotHasActiveSessionError extends Error {
  constructor(spotId: string) {
    super(`ParkingSpot ${spotId} cannot be deactivated because it has an active parking session.`);
    this.name = 'SpotHasActiveSessionError';
  }
}
