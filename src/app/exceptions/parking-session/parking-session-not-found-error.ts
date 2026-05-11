export class ParkingSessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`ParkingSession ${sessionId} was not found.`);
    this.name = 'ParkingSessionNotFoundError';
  }
}
