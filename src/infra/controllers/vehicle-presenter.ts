import { type Vehicle } from '@domain/parking/entities/vehicle.ts';

export interface VehicleResponse {
  id: string;
  driverId: string | null;
  parkingLotId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  deactivatedAt: string | null;
}

export const vehiclePresenter = {
  toResponse(vehicle: Vehicle): VehicleResponse {
    return {
      id: vehicle.id().value(),
      driverId: vehicle.driverId()?.value() ?? null,
      parkingLotId: vehicle.parkingLotId().value(),
      licensePlate: vehicle.licensePlate().value(),
      brand: vehicle.brand(),
      model: vehicle.model(),
      color: vehicle.color(),
      deactivatedAt: vehicle.deactivatedAt()?.toISOString() ?? null,
    };
  },
};
