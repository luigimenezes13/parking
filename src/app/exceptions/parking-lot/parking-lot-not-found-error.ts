export class ParkingLotNotFoundError extends Error {
  constructor(parkingLotId: string) {
    super(`ParkingLot ${parkingLotId} was not found.`);
    this.name = 'ParkingLotNotFoundError';
  }
}
