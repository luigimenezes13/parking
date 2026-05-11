import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

export interface UpdateVehicleAppearanceInput {
  vehicleId: string;
  brand: string | null;
  model: string | null;
  color: string | null;
}

@injectable()
export class UpdateVehicleAppearanceUseCase implements UseCase<
  UpdateVehicleAppearanceInput,
  Vehicle
> {
  private readonly vehicles: VehicleRepository;

  constructor(@inject(TYPES.VehicleRepository) vehicles: VehicleRepository) {
    this.vehicles = vehicles;
  }

  async execute(input: UpdateVehicleAppearanceInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(UniqueIdentifier.fromExisting(input.vehicleId));

    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }

    vehicle.updateAppearance({
      brand: input.brand,
      model: input.model,
      color: input.color,
    });
    await this.vehicles.save(vehicle);

    return vehicle;
  }
}
