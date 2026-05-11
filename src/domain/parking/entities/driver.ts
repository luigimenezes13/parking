import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';

export interface DriverProperties {
  cnh: string;
  name: string;
  email: string;
  phone: string;
  deactivatedAt?: Date | null;
}

export interface DriverInfo {
  name: string;
  email: string;
  phone: string;
}

export class Driver extends Entity<DriverProperties> {
  constructor(properties: DriverProperties, identifier?: UniqueIdentifier) {
    super({ ...properties, deactivatedAt: properties.deactivatedAt ?? null }, identifier);
  }

  static register(properties: Omit<DriverProperties, 'deactivatedAt'>): Driver {
    return new Driver({ ...properties, deactivatedAt: null });
  }

  updateInfo(info: DriverInfo): void {
    this.properties.name = info.name;
    this.properties.email = info.email;
    this.properties.phone = info.phone;
  }

  deactivate(now: Date): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('Driver', this.identifier.value());
    }

    this.properties.deactivatedAt = new Date(now.getTime());
  }

  isDeactivated(): boolean {
    return this.properties.deactivatedAt != null;
  }

  isActive(): boolean {
    return !this.isDeactivated();
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  cnh(): string {
    return this.properties.cnh;
  }

  name(): string {
    return this.properties.name;
  }

  email(): string {
    return this.properties.email;
  }

  phone(): string {
    return this.properties.phone;
  }

  deactivatedAt(): Date | null {
    return this.properties.deactivatedAt ? new Date(this.properties.deactivatedAt.getTime()) : null;
  }
}
