import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';

export interface MakeParkingLotOverrides {
  name?: string;
  address?: string;
  totalCapacity?: number;
}

export function makeParkingLot(overrides: MakeParkingLotOverrides = {}): ParkingLot {
  return ParkingLot.register({
    name: overrides.name ?? 'Test Lot',
    address: overrides.address ?? 'Test Address, 123',
    totalCapacity: overrides.totalCapacity ?? 50,
  });
}
