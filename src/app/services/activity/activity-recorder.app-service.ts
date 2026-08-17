import { inject, injectable } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type DomainEvent } from '@domain/shared/events/domain-event.ts';
import { ActivityEvent } from '@domain/activity/entities/activity-event.ts';
import {
  ActivityTypeVO,
  type ActivityTypeValue,
} from '@domain/activity/value-objects/activity-type-vo.ts';
import { type ActivityEventRepository } from '@domain/activity/repositories/activity-event-repository.ts';
import { type ActivityBroadcaster } from '@infra/realtime/activity-broadcaster.ts';

export interface DomainEventToActivityMapping {
  eventName: string;
  type: ActivityTypeValue;
  occurredAt?: (payload: Record<string, unknown>) => Date | undefined;
}

const MAPPINGS: ReadonlyArray<DomainEventToActivityMapping> = [
  {
    eventName: 'parking.vehicle.registered',
    type: 'VEHICLE_REGISTERED',
  },
  {
    eventName: 'parking.session.vehicle-entered',
    type: 'VEHICLE_ENTERED',
    occurredAt: (p) => coerceDate(p.entryAt),
  },
  {
    eventName: 'parking.session.started',
    type: 'SESSION_STARTED',
    occurredAt: (p) => coerceDate(p.entryAt),
  },
  {
    eventName: 'parking.session.spot-occupied',
    type: 'SPOT_OCCUPIED',
    occurredAt: (p) => coerceDate(p.occupiedAt),
  },
  {
    eventName: 'parking.session.spot-released',
    type: 'SPOT_RELEASED',
    occurredAt: (p) => coerceDate(p.releasedAt),
  },
  {
    eventName: 'parking.session.vehicle-exited',
    type: 'VEHICLE_EXITED',
    occurredAt: (p) => coerceDate(p.exitAt),
  },
  {
    eventName: 'parking.session.finished',
    type: 'SESSION_FINISHED',
    occurredAt: (p) => coerceDate(p.exitAt),
  },
  {
    eventName: 'parking.manual.force-finish-performed',
    type: 'MANUAL_FORCE_FINISH',
    occurredAt: (p) => coerceDate(p.performedAt),
  },
  {
    eventName: 'parking.manual.force-plate-performed',
    type: 'MANUAL_FORCE_PLATE',
    occurredAt: (p) => coerceDate(p.performedAt),
  },
  {
    eventName: 'parking.spot.maintenance-started',
    type: 'SPOT_MAINTENANCE_ON',
    occurredAt: (p) => coerceDate(p.startedAt),
  },
  {
    eventName: 'parking.spot.maintenance-ended',
    type: 'SPOT_MAINTENANCE_OFF',
    occurredAt: (p) => coerceDate(p.endedAt),
  },
  {
    eventName: 'parking.camera.went-online',
    type: 'CAMERA_ONLINE',
    occurredAt: (p) => coerceDate(p.observedAt),
  },
  {
    eventName: 'parking.camera.went-offline',
    type: 'CAMERA_OFFLINE',
    occurredAt: (p) => coerceDate(p.observedAt),
  },
];

const MAPPING_INDEX = new Map<string, DomainEventToActivityMapping>(
  MAPPINGS.map((mapping) => [mapping.eventName, mapping]),
);

@injectable()
export class ActivityRecorderAppService {
  private readonly repository: ActivityEventRepository;
  private readonly broadcaster: ActivityBroadcaster;

  constructor(
    @inject(TYPES.ActivityEventRepository) repository: ActivityEventRepository,
    @inject(TYPES.ActivityBroadcaster) broadcaster: ActivityBroadcaster,
  ) {
    this.repository = repository;
    this.broadcaster = broadcaster;
  }

  async handle(event: DomainEvent): Promise<void> {
    const mapping = MAPPING_INDEX.get(event.eventName);
    if (!mapping) {
      return;
    }

    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const parkingLotIdRaw = payload.parkingLotId;
    if (typeof parkingLotIdRaw !== 'string') {
      console.warn(
        JSON.stringify({
          level: 'warn',
          message: 'activity-recorder.missing-parking-lot-id',
          eventName: event.eventName,
        }),
      );
      return;
    }

    const occurredAt = mapping.occurredAt?.(payload) ?? new Date(event.occurredOn.getTime());

    const activityEvent = ActivityEvent.record({
      parkingLotId: UniqueIdentifier.fromExisting(parkingLotIdRaw),
      sessionId: optionalIdentifier(payload.sessionId),
      vehicleId: optionalIdentifier(payload.vehicleId),
      spotId: optionalIdentifier(payload.spotId),
      cameraId: optionalIdentifier(payload.cameraId),
      type: ActivityTypeVO.from(mapping.type),
      payload: serializablePayload(payload),
      occurredAt,
    });

    await this.repository.save(activityEvent);
    this.broadcaster.publish(parkingLotIdRaw, activityEvent);
  }
}

function coerceDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function optionalIdentifier(value: unknown): UniqueIdentifier | null {
  return typeof value === 'string' && value.length > 0
    ? UniqueIdentifier.fromExisting(value)
    : null;
}

function serializablePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else {
      result[key] = value;
    }
  }
  return result;
}
