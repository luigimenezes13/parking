import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';

export interface ParkingSessionResponse {
  id: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  spotId: string | null;
  spotCode: string | null;
  status: string;
  entryAt: string;
  spotReleasedAt: string | null;
  exitAt: string | null;
}

export const parkingSessionPresenter = {
  toResponse(session: ParkingSession): ParkingSessionResponse {
    const vehicle = session.vehicle();
    const spot = session.spot();

    return {
      id: session.id().value(),
      parkingLotId: session.parkingLotId().value(),
      vehicleId: vehicle?.id().value() ?? null,
      licensePlate: session.licensePlate()?.value() ?? null,
      spotId: spot?.id().value() ?? null,
      spotCode: spot?.code().value() ?? null,
      status: session.status().serialize(),
      entryAt: session.entryAt().toISOString(),
      spotReleasedAt: session.spotReleasedAt()?.toISOString() ?? null,
      exitAt: session.exitAt()?.toISOString() ?? null,
    };
  },
};
