import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<Vehicle | null>;
  findByLicensePlate(licensePlate: LicensePlateVO): Promise<Vehicle | null>;
  findByDriverId(driverId: UniqueIdentifier): Promise<Vehicle[]>;
  findByParkingLotId(parkingLotId: UniqueIdentifier): Promise<Vehicle[]>;
  findAll(): Promise<Vehicle[]>;
}
