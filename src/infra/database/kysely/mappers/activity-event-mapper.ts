import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ActivityEvent } from '@domain/activity/entities/activity-event.ts';
import {
  ActivityTypeVO,
  type ActivityTypeValue,
} from '@domain/activity/value-objects/activity-type-vo.ts';
import { type ActivityEvent as ActivityEventRow } from '@infra/database/types/Types.ts';

export type SelectableActivityEvent = Pick<
  Selectable<ActivityEventRow>,
  | 'id'
  | 'parking_lot_id'
  | 'session_id'
  | 'vehicle_id'
  | 'spot_id'
  | 'camera_id'
  | 'type'
  | 'payload'
  | 'occurred_at'
>;

export type InsertableActivityEventRow = {
  id: string;
  parking_lot_id: string;
  session_id: string | null;
  vehicle_id: string | null;
  spot_id: string | null;
  camera_id: string | null;
  type: ActivityTypeValue;
  payload: unknown;
  occurred_at: Date;
  created_at: Date;
};

@injectable()
export class ActivityEventMapper {
  toDomain(row: SelectableActivityEvent): ActivityEvent {
    return ActivityEvent.record({
      identifier: UniqueIdentifier.fromExisting(row.id),
      parkingLotId: UniqueIdentifier.fromExisting(row.parking_lot_id),
      sessionId: row.session_id ? UniqueIdentifier.fromExisting(row.session_id) : null,
      vehicleId: row.vehicle_id ? UniqueIdentifier.fromExisting(row.vehicle_id) : null,
      spotId: row.spot_id ? UniqueIdentifier.fromExisting(row.spot_id) : null,
      cameraId: row.camera_id ? UniqueIdentifier.fromExisting(row.camera_id) : null,
      type: ActivityTypeVO.from(row.type),
      payload: (row.payload as Record<string, unknown>) ?? {},
      occurredAt: row.occurred_at as Date,
    });
  }

  toInsert(event: ActivityEvent): InsertableActivityEventRow {
    return {
      id: event.id().value(),
      parking_lot_id: event.parkingLotId().value(),
      session_id: event.sessionId()?.value() ?? null,
      vehicle_id: event.vehicleId()?.value() ?? null,
      spot_id: event.spotId()?.value() ?? null,
      camera_id: event.cameraId()?.value() ?? null,
      type: event.type().serialize(),
      payload: event.payload(),
      occurred_at: event.occurredAt(),
      created_at: new Date(),
    };
  }
}
