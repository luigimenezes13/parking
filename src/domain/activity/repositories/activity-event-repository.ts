import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ActivityEvent } from '@domain/activity/entities/activity-event.ts';
import { type ActivityTypeValue } from '@domain/activity/value-objects/activity-type-vo.ts';

export interface ActivityEventFilters {
  from?: Date;
  to?: Date;
  types?: ActivityTypeValue[];
  plate?: string;
  spotId?: UniqueIdentifier;
  vehicleId?: UniqueIdentifier;
}

export interface ActivityEventPagination {
  page: number;
  pageSize: number;
}

export interface ActivityEventListResult {
  items: ActivityEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityDaySummary {
  date: string;
  entries: number;
  exits: number;
  spotsOccupied: number;
  spotsReleased: number;
  manualActions: number;
}

export interface ActivityEventRepository {
  save(event: ActivityEvent): Promise<void>;
  listByParkingLot(
    parkingLotId: UniqueIdentifier,
    filters: ActivityEventFilters,
    pagination: ActivityEventPagination,
  ): Promise<ActivityEventListResult>;
  summaryByDay(parkingLotId: UniqueIdentifier, date: Date): Promise<ActivityDaySummary>;
}
