import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { RegisterDriverRequest } from '@app/dto/inputs/driver/register-driver-input.ts';
import { DuplicateDriverCnhError } from '@app/exceptions/driver/duplicate-driver-cnh-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  usecase: RegisterDriverUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const usecase = new RegisterDriverUseCase(drivers);
  return { drivers, usecase };
}

describe('RegisterDriverUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('persists a new driver and returns the generated identifier', async () => {
    const result = await setup.usecase.execute(
      new RegisterDriverRequest({
        cnh: '12345678901',
        name: 'Joao Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
      }),
    );

    expect(result.driverId).toBeDefined();
    const stored = await setup.drivers.findByCnh('12345678901');
    expect(stored?.name()).toBe('Joao Silva');
    expect(stored?.isActive()).toBe(true);
  });

  it('throws DuplicateDriverCnhError when CNH is already taken', async () => {
    await setup.drivers.save(makeDriver({ cnh: '12345678901', email: 'first@example.com' }));

    await expect(
      setup.usecase.execute(
        new RegisterDriverRequest({
          cnh: '12345678901',
          name: 'Second',
          email: 'second@example.com',
          phone: '+5511222222222',
        }),
      ),
    ).rejects.toBeInstanceOf(DuplicateDriverCnhError);
  });

  it('throws DuplicateDriverEmailError when email is already taken', async () => {
    await setup.drivers.save(makeDriver({ cnh: '11111111111', email: 'shared@example.com' }));

    await expect(
      setup.usecase.execute(
        new RegisterDriverRequest({
          cnh: '22222222222',
          name: 'Second',
          email: 'shared@example.com',
          phone: '+5511222222222',
        }),
      ),
    ).rejects.toBeInstanceOf(DuplicateDriverEmailError);
  });
});
