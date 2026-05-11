export class DriverNotFoundError extends Error {
  constructor(driverId: string) {
    super(`Driver ${driverId} was not found.`);
    this.name = 'DriverNotFoundError';
  }
}
