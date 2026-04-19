import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class SpotNotFreeError extends DomainError {
  constructor(spotCode: string) {
    super(`Parking spot ${spotCode} is not free and cannot receive this transition.`);
  }
}
