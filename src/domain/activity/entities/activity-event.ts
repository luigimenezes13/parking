import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ActivityTypeVO } from '@domain/activity/value-objects/activity-type-vo.ts';

export interface ActivityEventProperties {
  parkingLotId: UniqueIdentifier;
  sessionId: UniqueIdentifier | null;
  vehicleId: UniqueIdentifier | null;
  spotId: UniqueIdentifier | null;
  cameraId: UniqueIdentifier | null;
  type: ActivityTypeVO;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface CreateActivityEventInput {
  identifier?: UniqueIdentifier;
  parkingLotId: UniqueIdentifier;
  sessionId?: UniqueIdentifier | null;
  vehicleId?: UniqueIdentifier | null;
  spotId?: UniqueIdentifier | null;
  cameraId?: UniqueIdentifier | null;
  type: ActivityTypeVO;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class ActivityEvent extends Entity<ActivityEventProperties> {
  constructor(properties: ActivityEventProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static record(input: CreateActivityEventInput): ActivityEvent {
    return new ActivityEvent(
      {
        parkingLotId: input.parkingLotId,
        sessionId: input.sessionId ?? null,
        vehicleId: input.vehicleId ?? null,
        spotId: input.spotId ?? null,
        cameraId: input.cameraId ?? null,
        type: input.type,
        payload: Object.freeze({ ...input.payload }) as Record<string, unknown>,
        occurredAt: new Date(input.occurredAt.getTime()),
      },
      input.identifier,
    );
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  parkingLotId(): UniqueIdentifier {
    return this.properties.parkingLotId;
  }

  sessionId(): UniqueIdentifier | null {
    return this.properties.sessionId;
  }

  vehicleId(): UniqueIdentifier | null {
    return this.properties.vehicleId;
  }

  spotId(): UniqueIdentifier | null {
    return this.properties.spotId;
  }

  cameraId(): UniqueIdentifier | null {
    return this.properties.cameraId;
  }

  type(): ActivityTypeVO {
    return this.properties.type;
  }

  payload(): Record<string, unknown> {
    return this.properties.payload;
  }

  occurredAt(): Date {
    return new Date(this.properties.occurredAt.getTime());
  }
}
