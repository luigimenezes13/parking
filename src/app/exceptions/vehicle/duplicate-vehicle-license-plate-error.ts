export class DuplicateVehicleLicensePlateError extends Error {
  constructor(licensePlate: string) {
    super(`A vehicle with license plate "${licensePlate}" already exists.`);
    this.name = 'DuplicateVehicleLicensePlateError';
  }
}
