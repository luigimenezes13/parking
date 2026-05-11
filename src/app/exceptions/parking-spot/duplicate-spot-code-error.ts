export class DuplicateSpotCodeError extends Error {
  constructor(parkingLotId: string, code: string) {
    super(`A spot with code "${code}" already exists in parking lot ${parkingLotId}.`);
    this.name = 'DuplicateSpotCodeError';
  }
}
