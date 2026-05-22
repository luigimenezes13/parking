import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';

export interface CameraStaleQuery {
  staleBefore: Date;
}

export interface CameraRepository {
  save(camera: Camera): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<Camera | null>;
  findByParkingLot(parkingLotId: UniqueIdentifier): Promise<Camera[]>;
  findStaleOnline(query: CameraStaleQuery): Promise<Camera[]>;
}
