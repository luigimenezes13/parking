import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class SessionAlreadyHasSpotError extends DomainError {
  constructor(sessionIdentifier: string) {
    super(`Parking session ${sessionIdentifier} already has a spot assigned.`);
  }
}
