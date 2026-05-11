import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';

export interface ParkingLotResponse {
  id: string;
  name: string;
  address: string;
  totalCapacity: number;
  deactivatedAt: string | null;
}

export const parkingLotPresenter = {
  toResponse(parkingLot: ParkingLot): ParkingLotResponse {
    return {
      id: parkingLot.id().value(),
      name: parkingLot.name(),
      address: parkingLot.address(),
      totalCapacity: parkingLot.totalCapacity(),
      deactivatedAt: parkingLot.deactivatedAt()?.toISOString() ?? null,
    };
  },
};
