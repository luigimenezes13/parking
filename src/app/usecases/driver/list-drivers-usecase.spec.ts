import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  usecase: ListDriversUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const usecase = new ListDriversUseCase(drivers);
  return { drivers, usecase };
}

describe('ListDriversUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all active drivers', async () => {
    const driverA = makeDriver({ cnh: '11111111111', email: 'a@example.com' });
    const driverB = makeDriver({ cnh: '22222222222', email: 'b@example.com' });
    await setup.drivers.save(driverA);
    await setup.drivers.save(driverB);

    const found = await setup.usecase.execute({});

    expect(found).toHaveLength(2);
  });

  it('excludes deactivated drivers from the list', async () => {
    const active = makeDriver({ cnh: '11111111111', email: 'active@example.com' });
    const archived = makeDriver({ cnh: '22222222222', email: 'archived@example.com' });
    archived.deactivate(new Date());
    await setup.drivers.save(active);
    await setup.drivers.save(archived);

    const found = await setup.usecase.execute({});

    expect(found).toHaveLength(1);
    expect(found[0]?.cnh()).toBe('11111111111');
  });

  it('returns an empty array when no drivers are registered', async () => {
    const found = await setup.usecase.execute({});
    expect(found).toEqual([]);
  });
});
