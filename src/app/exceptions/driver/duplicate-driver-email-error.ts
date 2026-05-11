export class DuplicateDriverEmailError extends Error {
  constructor(email: string) {
    super(`A driver with email "${email}" already exists.`);
    this.name = 'DuplicateDriverEmailError';
  }
}
