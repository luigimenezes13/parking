import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UpdateDriverInfoRequest } from '@app/dto/inputs/driver/update-driver-info-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

@injectable()
export class UpdateDriverInfoUseCase implements UseCase<UpdateDriverInfoRequest, Driver> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(input: UpdateDriverInfoRequest): Promise<Driver> {
    const { driverId, name, email, phone } = input.props;

    const driver = await this.drivers.findById(UniqueIdentifier.fromExisting(driverId));

    if (!driver) {
      throw new DriverNotFoundError(driverId);
    }

    if (email !== driver.email()) {
      const owner = await this.drivers.findByEmail(email);
      if (owner && !owner.id().equals(driver.id())) {
        throw new DuplicateDriverEmailError(email);
      }
    }

    driver.updateInfo({ name, email, phone });
    await this.drivers.save(driver);

    return driver;
  }
}
