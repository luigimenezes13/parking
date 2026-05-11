import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';

export class InMemoryVehicleRepository implements VehicleRepository {
  private readonly vehicles = new Map<string, Vehicle>();

  async save(vehicle: Vehicle): Promise<void> {
    this.vehicles.set(vehicle.id().value(), vehicle);
  }

  async findById(identifier: UniqueIdentifier): Promise<Vehicle | null> {
    return this.vehicles.get(identifier.value()) ?? null;
  }

  async findByLicensePlate(licensePlate: LicensePlateVO): Promise<Vehicle | null> {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.licensePlate().equals(licensePlate)) {
        return vehicle;
      }
    }
    return null;
  }

  async findByDriverId(driverId: UniqueIdentifier): Promise<Vehicle[]> {
    const matches: Vehicle[] = [];
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.isActive() && vehicle.belongsTo(driverId)) {
        matches.push(vehicle);
      }
    }
    return matches;
  }

  async findByParkingLotId(parkingLotId: UniqueIdentifier): Promise<Vehicle[]> {
    const matches: Vehicle[] = [];
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.isActive() && vehicle.parkingLotId().equals(parkingLotId)) {
        matches.push(vehicle);
      }
    }
    return matches;
  }

  async findAll(): Promise<Vehicle[]> {
    const active: Vehicle[] = [];
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.isActive()) {
        active.push(vehicle);
      }
    }
    return active;
  }
}
