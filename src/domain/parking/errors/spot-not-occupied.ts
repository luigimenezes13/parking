import { DomainError } from '../../shared/errors/domain-error.ts';

export class SpotNotOccupiedError extends DomainError {
  constructor(spotCode: string) {
    super(`Parking spot ${spotCode} is not occupied and cannot be released.`);
  }
}
