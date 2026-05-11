export class ParkingLotHasActiveSessionsError extends Error {
  constructor(parkingLotId: string) {
    super(
      `ParkingLot ${parkingLotId} cannot be deactivated because it has active parking sessions.`,
    );
    this.name = 'ParkingLotHasActiveSessionsError';
  }
}
