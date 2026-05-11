import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';

export interface ParkingSpotResponse {
  id: string;
  parkingLotId: string;
  code: string;
  floor: number;
  row: number;
  column: number;
  isCovered: boolean;
  spotType: string;
  status: string;
  deactivatedAt: string | null;
}

export const parkingSpotPresenter = {
  toResponse(spot: ParkingSpot): ParkingSpotResponse {
    return {
      id: spot.id().value(),
      parkingLotId: spot.parkingLotId().value(),
      code: spot.code().value(),
      floor: spot.floor(),
      row: spot.row(),
      column: spot.column(),
      isCovered: spot.isCovered(),
      spotType: spot.spotType().serialize(),
      status: spot.status().serialize(),
      deactivatedAt: spot.deactivatedAt()?.toISOString() ?? null,
    };
  },
};
