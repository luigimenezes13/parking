import { UniqueIdentifier } from './value-objects/unique-identifier.ts';

export abstract class Entity<Properties> {
  protected readonly identifier: UniqueIdentifier;
  protected readonly properties: Properties;

  protected constructor(properties: Properties, identifier?: UniqueIdentifier) {
    this.identifier = identifier ?? UniqueIdentifier.create();
    this.properties = properties;
  }

  equals(other: Entity<Properties>): boolean {
    if (other === this) {
      return true;
    }

    return this.identifier.equals(other.identifier);
  }
}
