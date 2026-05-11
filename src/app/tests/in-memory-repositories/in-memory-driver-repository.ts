import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';

export class InMemoryDriverRepository implements DriverRepository {
  private readonly drivers = new Map<string, Driver>();

  async save(driver: Driver): Promise<void> {
    this.drivers.set(driver.id().value(), driver);
  }

  async findById(identifier: UniqueIdentifier): Promise<Driver | null> {
    return this.drivers.get(identifier.value()) ?? null;
  }

  async findByCnh(cnh: string): Promise<Driver | null> {
    for (const driver of this.drivers.values()) {
      if (driver.cnh() === cnh) {
        return driver;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<Driver | null> {
    for (const driver of this.drivers.values()) {
      if (driver.email() === email) {
        return driver;
      }
    }
    return null;
  }

  async findAll(): Promise<Driver[]> {
    const active: Driver[] = [];
    for (const driver of this.drivers.values()) {
      if (driver.isActive()) {
        active.push(driver);
      }
    }
    return active;
  }
}
