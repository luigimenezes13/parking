import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { DuplicateDriverCnhError } from '@app/exceptions/driver/duplicate-driver-cnh-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

export interface RegisterDriverInput {
  cnh: string;
  name: string;
  email: string;
  phone: string;
}

export interface RegisterDriverOutput {
  driverId: string;
}

@injectable()
export class RegisterDriverUseCase implements UseCase<RegisterDriverInput, RegisterDriverOutput> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(input: RegisterDriverInput): Promise<RegisterDriverOutput> {
    const existingByCnh = await this.drivers.findByCnh(input.cnh);
    if (existingByCnh) {
      throw new DuplicateDriverCnhError(input.cnh);
    }

    const existingByEmail = await this.drivers.findByEmail(input.email);
    if (existingByEmail) {
      throw new DuplicateDriverEmailError(input.email);
    }

    const driver = Driver.register({
      cnh: input.cnh,
      name: input.name,
      email: input.email,
      phone: input.phone,
    });

    await this.drivers.save(driver);

    return { driverId: driver.id().value() };
  }
}
