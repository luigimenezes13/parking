import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { CameraNameVO } from '@domain/parking/value-objects/camera-name-vo.ts';
import { StreamUrlVO } from '@domain/parking/value-objects/stream-url-vo.ts';
import { CameraStatusVO } from '@domain/parking/value-objects/camera-status-vo.ts';
import { type Camera as CameraRow } from '@infra/database/types/Types.ts';

type CameraStatusValue = 'ONLINE' | 'OFFLINE' | 'UNREGISTERED';

export type SelectableCamera = Pick<
  Selectable<CameraRow>,
  'id' | 'parking_lot_id' | 'name' | 'stream_url' | 'status' | 'last_seen_at' | 'deactivated_at'
>;

export type InsertableCameraRow = {
  id: string;
  parking_lot_id: string;
  name: string;
  stream_url: string;
  status: CameraStatusValue;
  last_seen_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deactivated_at: Date | null;
};

export type UpdatableCameraRow = {
  name: string;
  stream_url: string;
  status: CameraStatusValue;
  last_seen_at: Date | null;
  deactivated_at: Date | null;
  updated_at: Date;
};

@injectable()
export class CameraMapper {
  toDomain(row: SelectableCamera): Camera {
    return new Camera(
      {
        parkingLotId: UniqueIdentifier.fromExisting(row.parking_lot_id),
        name: CameraNameVO.from(row.name),
        streamUrl: StreamUrlVO.from(row.stream_url),
        status: CameraStatusVO.fromExisting(row.status as CameraStatusValue),
        lastSeenAt: row.last_seen_at as Date | null,
        deactivatedAt: row.deactivated_at as Date | null,
      },
      UniqueIdentifier.fromExisting(row.id),
    );
  }

  toInsert(camera: Camera): InsertableCameraRow {
    const now = new Date();

    return {
      id: camera.id().value(),
      parking_lot_id: camera.parkingLotId().value(),
      name: camera.name().value(),
      stream_url: camera.streamUrl().value(),
      status: camera.status().serialize(),
      last_seen_at: camera.lastSeenAt(),
      created_at: now,
      updated_at: now,
      deactivated_at: camera.deactivatedAt(),
    };
  }

  toUpdate(camera: Camera): UpdatableCameraRow {
    return {
      name: camera.name().value(),
      stream_url: camera.streamUrl().value(),
      status: camera.status().serialize(),
      last_seen_at: camera.lastSeenAt(),
      deactivated_at: camera.deactivatedAt(),
      updated_at: new Date(),
    };
  }
}
