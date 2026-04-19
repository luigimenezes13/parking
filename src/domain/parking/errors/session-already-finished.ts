import { DomainError } from '../../shared/errors/domain-error.ts';

export class SessionAlreadyFinishedError extends DomainError {
  constructor(sessionIdentifier: string) {
    super(`Parking session ${sessionIdentifier} has already been finished.`);
  }
}
