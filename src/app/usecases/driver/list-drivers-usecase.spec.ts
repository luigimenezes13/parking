import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';

describe('ListDriversUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let usecase: ListDriversUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    usecase = new ListDriversUseCase(drivers);
  });

  it('returns all active drivers', async () => {
    const driverA = Driver.register({
      cnh: '11111111111',
      name: 'A',
      email: 'a@example.com',
      phone: '+5511111111111',
    });
    const driverB = Driver.register({
      cnh: '22222222222',
      name: 'B',
      email: 'b@example.com',
      phone: '+5511222222222',
    });
    await drivers.save(driverA);
    await drivers.save(driverB);

    const found = await usecase.execute({});

    expect(found).toHaveLength(2);
  });

  it('excludes deactivated drivers from the list', async () => {
    const active = Driver.register({
      cnh: '11111111111',
      name: 'Active',
      email: 'active@example.com',
      phone: '+5511111111111',
    });
    const archived = Driver.register({
      cnh: '22222222222',
      name: 'Archived',
      email: 'archived@example.com',
      phone: '+5511222222222',
    });
    archived.deactivate(new Date());
    await drivers.save(active);
    await drivers.save(archived);

    const found = await usecase.execute({});

    expect(found).toHaveLength(1);
    expect(found[0]?.cnh()).toBe('11111111111');
  });

  it('returns an empty array when no drivers are registered', async () => {
    const found = await usecase.execute({});
    expect(found).toEqual([]);
  });
});
