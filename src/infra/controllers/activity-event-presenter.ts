import { type ActivityEvent } from '@domain/activity/entities/activity-event.ts';

export interface ActivityEventResponse {
  id: string;
  parkingLotId: string;
  sessionId: string | null;
  vehicleId: string | null;
  spotId: string | null;
  cameraId: string | null;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export const activityEventPresenter = {
  toResponse(event: ActivityEvent): ActivityEventResponse {
    return {
      id: event.id().value(),
      parkingLotId: event.parkingLotId().value(),
      sessionId: event.sessionId()?.value() ?? null,
      vehicleId: event.vehicleId()?.value() ?? null,
      spotId: event.spotId()?.value() ?? null,
      cameraId: event.cameraId()?.value() ?? null,
      type: event.type().serialize(),
      payload: event.payload(),
      occurredAt: event.occurredAt().toISOString(),
    };
  },
};
