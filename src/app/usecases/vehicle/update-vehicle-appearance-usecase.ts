import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type UpdateVehicleAppearanceRequest } from '@app/dto/inputs/vehicle/update-vehicle-appearance-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

@injectable()
export class UpdateVehicleAppearanceUseCase implements UseCase<
  UpdateVehicleAppearanceRequest,
  Vehicle
> {
  private readonly vehicles: VehicleRepository;

  constructor(@inject(TYPES.VehicleRepository) vehicles: VehicleRepository) {
    this.vehicles = vehicles;
  }

  async execute(input: UpdateVehicleAppearanceRequest): Promise<Vehicle> {
    const { vehicleId, brand, model, color } = input.props;

    const vehicle = await this.vehicles.findById(UniqueIdentifier.fromExisting(vehicleId));

    if (!vehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    vehicle.updateAppearance({ brand, model, color });
    await this.vehicles.save(vehicle);

    return vehicle;
  }
}
