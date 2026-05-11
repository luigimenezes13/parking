import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

describe('DeactivateDriverUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let usecase: DeactivateDriverUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    usecase = new DeactivateDriverUseCase(drivers);
  });

  it('marks the driver as deactivated', async () => {
    const driver = Driver.register({
      cnh: '12345678901',
      name: 'Joao',
      email: 'joao@example.com',
      phone: '+5511999999999',
    });
    await drivers.save(driver);

    const deactivated = await usecase.execute({ driverId: driver.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
    expect(deactivated.deactivatedAt()).toBeInstanceOf(Date);
  });

  it('throws DriverNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it('throws EntityAlreadyDeactivatedError when the driver is already deactivated', async () => {
    const driver = Driver.register({
      cnh: '12345678901',
      name: 'Joao',
      email: 'joao@example.com',
      phone: '+5511999999999',
    });
    driver.deactivate(new Date());
    await drivers.save(driver);

    await expect(usecase.execute({ driverId: driver.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
