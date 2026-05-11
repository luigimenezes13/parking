import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

describe('GetDriverByIdUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let usecase: GetDriverByIdUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    usecase = new GetDriverByIdUseCase(drivers);
  });

  it('returns the driver when found', async () => {
    const driver = Driver.register({
      cnh: '12345678901',
      name: 'Joao',
      email: 'joao@example.com',
      phone: '+5511999999999',
    });
    await drivers.save(driver);

    const found = await usecase.execute({ driverId: driver.id().value() });

    expect(found.id().equals(driver.id())).toBe(true);
  });

  it('throws DriverNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
