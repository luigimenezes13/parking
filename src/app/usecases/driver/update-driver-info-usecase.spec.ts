import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { UpdateDriverInfoRequest } from '@app/dto/inputs/driver/update-driver-info-input.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { DuplicateDriverEmailError } from '@app/exceptions/driver/duplicate-driver-email-error.ts';

describe('UpdateDriverInfoUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let usecase: UpdateDriverInfoUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    usecase = new UpdateDriverInfoUseCase(drivers);
  });

  it('updates name, email and phone keeping CNH immutable', async () => {
    const driver = Driver.register({
      cnh: '12345678901',
      name: 'Old',
      email: 'old@example.com',
      phone: '+5511111111111',
    });
    await drivers.save(driver);

    const updated = await usecase.execute(
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
      usecase.execute(
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
    const target = Driver.register({
      cnh: '11111111111',
      name: 'Target',
      email: 'target@example.com',
      phone: '+5511111111111',
    });
    const other = Driver.register({
      cnh: '22222222222',
      name: 'Other',
      email: 'other@example.com',
      phone: '+5511222222222',
    });
    await drivers.save(target);
    await drivers.save(other);

    await expect(
      usecase.execute(
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
    const driver = Driver.register({
      cnh: '12345678901',
      name: 'Original',
      email: 'same@example.com',
      phone: '+5511111111111',
    });
    await drivers.save(driver);

    const updated = await usecase.execute(
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
