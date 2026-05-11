import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { DuplicateDriverCnhError } from '@app/exceptions/driver/duplicate-driver-cnh-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

describe('RegisterDriverUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let usecase: RegisterDriverUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    usecase = new RegisterDriverUseCase(drivers);
  });

  it('persists a new driver and returns the generated identifier', async () => {
    const result = await usecase.execute({
      cnh: '12345678901',
      name: 'Joao Silva',
      email: 'joao@example.com',
      phone: '+5511999999999',
    });

    expect(result.driverId).toBeDefined();
    const stored = await drivers.findByCnh('12345678901');
    expect(stored?.name()).toBe('Joao Silva');
    expect(stored?.isActive()).toBe(true);
  });

  it('throws DuplicateDriverCnhError when CNH is already taken', async () => {
    await drivers.save(
      Driver.register({
        cnh: '12345678901',
        name: 'First',
        email: 'first@example.com',
        phone: '+5511111111111',
      }),
    );

    await expect(
      usecase.execute({
        cnh: '12345678901',
        name: 'Second',
        email: 'second@example.com',
        phone: '+5511222222222',
      }),
    ).rejects.toBeInstanceOf(DuplicateDriverCnhError);
  });

  it('throws DuplicateDriverEmailError when email is already taken', async () => {
    await drivers.save(
      Driver.register({
        cnh: '11111111111',
        name: 'First',
        email: 'shared@example.com',
        phone: '+5511111111111',
      }),
    );

    await expect(
      usecase.execute({
        cnh: '22222222222',
        name: 'Second',
        email: 'shared@example.com',
        phone: '+5511222222222',
      }),
    ).rejects.toBeInstanceOf(DuplicateDriverEmailError);
  });
});
