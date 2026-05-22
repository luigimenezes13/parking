export class CameraNotFoundError extends Error {
  constructor(cameraId: string) {
    super(`Camera ${cameraId} was not found.`);
    this.name = 'CameraNotFoundError';
  }
}
