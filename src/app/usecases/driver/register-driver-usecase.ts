import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type RegisterDriverRequest } from '@app/dto/inputs/driver/register-driver-input.ts';
import { Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { DuplicateDriverCnhError } from '@app/exceptions/driver/duplicate-driver-cnh-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

export interface RegisterDriverOutput {
  driverId: string;
}

@injectable()
export class RegisterDriverUseCase implements UseCase<RegisterDriverRequest, RegisterDriverOutput> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(input: RegisterDriverRequest): Promise<RegisterDriverOutput> {
    const { cnh, name, email, phone } = input.props;

    const existingByCnh = await this.drivers.findByCnh(cnh);
    if (existingByCnh) {
      throw new DuplicateDriverCnhError(cnh);
    }

    const existingByEmail = await this.drivers.findByEmail(email);
    if (existingByEmail) {
      throw new DuplicateDriverEmailError(email);
    }

    const driver = Driver.register({ cnh, name, email, phone });

    await this.drivers.save(driver);

    return { driverId: driver.id().value() };
  }
}
