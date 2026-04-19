import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type Vehicle } from '@domain/parking/aggregates/vehicle/vehicle.ts';

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<void>;
  findByLicensePlate(licensePlate: LicensePlateVO): Promise<Vehicle | null>;
}
