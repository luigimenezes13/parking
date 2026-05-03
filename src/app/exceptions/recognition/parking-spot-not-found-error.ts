export class ParkingSpotNotFoundError extends Error {
  constructor(parkingLotId: string, code: string) {
    super(`ParkingSpot with code "${code}" was not found in parking lot ${parkingLotId}.`);
    this.name = 'ParkingSpotNotFoundError';
  }
}
