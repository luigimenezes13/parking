import { DomainError } from '../../shared/errors/domain-error.ts';

export class InvalidLicensePlateError extends DomainError {
  constructor(rawValue: string) {
    super(`License plate "${rawValue}" does not match Brazilian Mercosul or legacy format.`);
  }
}
