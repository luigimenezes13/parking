import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  usecase: GetDriverByIdUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const usecase = new GetDriverByIdUseCase(drivers);
  return { drivers, usecase };
}

describe('GetDriverByIdUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns the driver when found', async () => {
    const driver = makeDriver();
    await setup.drivers.save(driver);

    const found = await setup.usecase.execute({ driverId: driver.id().value() });

    expect(found.id().equals(driver.id())).toBe(true);
  });

  it('throws DriverNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
