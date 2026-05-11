import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';

export type ListDriversInput = Record<string, never>;

@injectable()
export class ListDriversUseCase implements UseCase<ListDriversInput, Driver[]> {
  private readonly drivers: DriverRepository;

  constructor(@inject(TYPES.DriverRepository) drivers: DriverRepository) {
    this.drivers = drivers;
  }

  async execute(_input: ListDriversInput): Promise<Driver[]> {
    return this.drivers.findAll();
  }
}
