export abstract class ValueObject<Properties> {
  protected readonly properties: Properties;

  protected constructor(properties: Properties) {
    this.properties = Object.freeze(properties);
  }

  equals(other: ValueObject<Properties>): boolean {
    if (!other) {
      return false;
    }

    return JSON.stringify(this.properties) === JSON.stringify(other.properties);
  }
}
