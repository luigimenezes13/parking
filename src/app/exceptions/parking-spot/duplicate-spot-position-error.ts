export class DuplicateSpotPositionError extends Error {
  constructor(parkingLotId: string, floor: number, row: number, column: number) {
    super(
      `A spot at position floor=${floor}, row=${row}, column=${column} already exists in parking lot ${parkingLotId}.`,
    );
    this.name = 'DuplicateSpotPositionError';
  }
}
