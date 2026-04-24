import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';

export interface DriverProperties {
  cnh: string;
  name: string;
  email: string;
  phone: string;
}

export class Driver extends Entity<DriverProperties> {
  constructor(properties: DriverProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(properties: DriverProperties): Driver {
    return new Driver(properties);
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
