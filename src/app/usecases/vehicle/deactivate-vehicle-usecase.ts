import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { VehicleHasActiveSessionError } from '@app/exceptions/vehicle/vehicle-has-active-session-error.ts';

export interface DeactivateVehicleInput {
  vehicleId: string;
}

@injectable()
export class DeactivateVehicleUseCase implements UseCase<DeactivateVehicleInput, Vehicle> {
  private readonly vehicles: VehicleRepository;
  private readonly sessions: ParkingSessionRepository;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
  ) {
    this.vehicles = vehicles;
    this.sessions = sessions;
  }

  async execute(input: DeactivateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(UniqueIdentifier.fromExisting(input.vehicleId));

    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }

    const activeSession = await this.sessions.findActiveByPlate(vehicle.licensePlate());
    if (activeSession) {
      throw new VehicleHasActiveSessionError(input.vehicleId);
    }

    vehicle.deactivate(new Date());
    await this.vehicles.save(vehicle);

    return vehicle;
  }
}
