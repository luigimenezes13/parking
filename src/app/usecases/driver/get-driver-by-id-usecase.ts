import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

export interface GetDriverByIdInput {
  driverId: string;
}

@injectable()
export class GetDriverByIdUseCase implements UseCase<GetDriverByIdInput, Driver> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(input: GetDriverByIdInput): Promise<Driver> {
    const driver = await this.drivers.findById(UniqueIdentifier.fromExisting(input.driverId));

    if (!driver) {
      throw new DriverNotFoundError(input.driverId);
    }

    return driver;
  }
}
