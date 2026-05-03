export class InvalidRecognitionPlateError extends Error {
  constructor(eventType: string) {
    super(`Recognition event "${eventType}" cannot be processed without a license plate.`);
    this.name = 'InvalidRecognitionPlateError';
  }
}
