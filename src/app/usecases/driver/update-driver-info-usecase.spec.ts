import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { UpdateDriverInfoRequest } from '@app/dto/inputs/driver/update-driver-info-input.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  usecase: UpdateDriverInfoUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const usecase = new UpdateDriverInfoUseCase(drivers);
  return { drivers, usecase };
}

describe('UpdateDriverInfoUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('updates name, email and phone keeping CNH immutable', async () => {
    const driver = makeDriver({
      cnh: '12345678901',
      name: 'Old',
      email: 'old@example.com',
      phone: '+5511111111111',
    });
    await setup.drivers.save(driver);

    const updated = await setup.usecase.execute(
      new UpdateDriverInfoRequest({
        driverId: driver.id().value(),
        name: 'New',
        email: 'new@example.com',
        phone: '+5511222222222',
      }),
    );

    expect(updated.name()).toBe('New');
    expect(updated.email()).toBe('new@example.com');
    expect(updated.phone()).toBe('+5511222222222');
    expect(updated.cnh()).toBe('12345678901');
  });

  it('throws DriverNotFoundError when driver does not exist', async () => {
    await expect(
      setup.usecase.execute(
        new UpdateDriverInfoRequest({
          driverId: '00000000-0000-4000-8000-000000000000',
          name: 'X',
          email: 'x@example.com',
          phone: '+5511000000000',
        }),
      ),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it('throws DuplicateDriverEmailError when new email is owned by another driver', async () => {
    const target = makeDriver({ cnh: '11111111111', email: 'target@example.com' });
    const other = makeDriver({ cnh: '22222222222', email: 'other@example.com' });
    await setup.drivers.save(target);
    await setup.drivers.save(other);

    await expect(
      setup.usecase.execute(
        new UpdateDriverInfoRequest({
          driverId: target.id().value(),
          name: 'Target',
          email: 'other@example.com',
          phone: '+5511111111111',
        }),
      ),
    ).rejects.toBeInstanceOf(DuplicateDriverEmailError);
  });

  it('accepts updating to the same email (no conflict with self)', async () => {
    const driver = makeDriver({ email: 'same@example.com' });
    await setup.drivers.save(driver);

    const updated = await setup.usecase.execute(
      new UpdateDriverInfoRequest({
        driverId: driver.id().value(),
        name: 'Updated',
        email: 'same@example.com',
        phone: '+5511111111111',
      }),
    );

    expect(updated.email()).toBe('same@example.com');
    expect(updated.name()).toBe('Updated');
  });
});
