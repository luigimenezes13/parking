import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

export interface UpdateDriverInfoInput {
  driverId: string;
  name: string;
  email: string;
  phone: string;
}

@injectable()
export class UpdateDriverInfoUseCase implements UseCase<UpdateDriverInfoInput, Driver> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(input: UpdateDriverInfoInput): Promise<Driver> {
    const driver = await this.drivers.findById(UniqueIdentifier.fromExisting(input.driverId));

    if (!driver) {
      throw new DriverNotFoundError(input.driverId);
    }

    if (input.email !== driver.email()) {
      const owner = await this.drivers.findByEmail(input.email);
      if (owner && !owner.id().equals(driver.id())) {
        throw new DuplicateDriverEmailError(input.email);
      }
    }

    driver.updateInfo({ name: input.name, email: input.email, phone: input.phone });
    await this.drivers.save(driver);

    return driver;
  }
}
