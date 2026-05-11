import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

export interface GetVehicleByIdInput {
  vehicleId: string;
}

@injectable()
export class GetVehicleByIdUseCase implements UseCase<GetVehicleByIdInput, Vehicle> {
  private readonly vehicles: VehicleRepository;

  constructor(@inject(TYPES.VehicleRepository) vehicles: VehicleRepository) {
    this.vehicles = vehicles;
  }

  async execute(input: GetVehicleByIdInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(UniqueIdentifier.fromExisting(input.vehicleId));

    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }

    return vehicle;
  }
}
