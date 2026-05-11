import { beforeEach, describe, expect, it } from 'vitest';

import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  usecase: DeactivateDriverUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const usecase = new DeactivateDriverUseCase(drivers);
  return { drivers, usecase };
}

describe('DeactivateDriverUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('marks the driver as deactivated', async () => {
    const driver = makeDriver();
    await setup.drivers.save(driver);

    const deactivated = await setup.usecase.execute({ driverId: driver.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
    expect(deactivated.deactivatedAt()).toBeInstanceOf(Date);
  });

  it('throws DriverNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it('throws EntityAlreadyDeactivatedError when the driver is already deactivated', async () => {
    const driver = makeDriver();
    driver.deactivate(new Date());
    await setup.drivers.save(driver);

    await expect(setup.usecase.execute({ driverId: driver.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
