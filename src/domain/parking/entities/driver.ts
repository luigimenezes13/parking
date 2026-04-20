import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';

interface DriverProperties {
  cnh: string;
  name: string;
  email: string;
  phone: string;
}

export interface DriverRegistration {
  cnh: string;
  name: string;
  email: string;
  phone: string;
}

export interface DriverRehydration extends DriverRegistration {
  identifier: UniqueIdentifier;
}

export class Driver extends Entity<DriverProperties> {
  private constructor(properties: DriverProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(registration: DriverRegistration): Driver {
    return new Driver({
      cnh: registration.cnh,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
    });
  }

  static rehydrate(rehydration: DriverRehydration): Driver {
    return new Driver(
      {
        cnh: rehydration.cnh,
        name: rehydration.name,
        email: rehydration.email,
        phone: rehydration.phone,
      },
      rehydration.identifier,
    );
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
}
