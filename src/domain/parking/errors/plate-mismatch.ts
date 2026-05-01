import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class PlateMismatchError extends DomainError {
  constructor(sessionPlate: string, vehiclePlate: string) {
    super(
      `Vehicle plate ${vehiclePlate} does not match session plate ${sessionPlate}.`,
    );
  }
}
