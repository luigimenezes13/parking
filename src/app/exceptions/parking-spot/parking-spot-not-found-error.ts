export class ParkingSpotNotFoundError extends Error {
  constructor(identifier: string) {
    super(`ParkingSpot ${identifier} was not found.`);
    this.name = 'ParkingSpotNotFoundError';
  }
}
