import { DomainError } from '../../shared/errors/domain-error.ts';

export class DuplicateActiveSessionForVehicleError extends DomainError {
  constructor(licensePlate: string) {
    super(`Vehicle with license plate ${licensePlate} already has an active parking session.`);
  }
}
