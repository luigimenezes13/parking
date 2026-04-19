import { type LicensePlate } from '../../value-objects/license-plate.ts';
import { type Vehicle } from './vehicle.ts';

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<void>;
  findByLicensePlate(licensePlate: LicensePlate): Promise<Vehicle | null>;
}
