import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class DuplicateActiveSessionForSpotError extends DomainError {
  constructor(spotCode: string) {
    super(`Parking spot ${spotCode} already has an active session bound to it.`);
  }
}
