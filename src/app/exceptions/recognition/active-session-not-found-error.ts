export class ActiveSessionNotFoundError extends Error {
  constructor(criteria: string) {
    super(`No active ParkingSession was found for ${criteria}.`);
    this.name = 'ActiveSessionNotFoundError';
  }
}
