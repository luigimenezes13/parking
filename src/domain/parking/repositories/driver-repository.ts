import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';

export interface DriverRepository {
  save(driver: Driver): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<Driver | null>;
  findByCnh(cnh: string): Promise<Driver | null>;
  findByEmail(email: string): Promise<Driver | null>;
  findAll(): Promise<Driver[]>;
}
