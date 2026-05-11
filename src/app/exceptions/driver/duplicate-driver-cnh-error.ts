export class DuplicateDriverCnhError extends Error {
  constructor(cnh: string) {
    super(`A driver with CNH "${cnh}" already exists.`);
    this.name = 'DuplicateDriverCnhError';
  }
}
