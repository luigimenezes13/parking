import {
  type ParkingLotMapActiveSession,
  type ParkingLotMapFloor,
  type ParkingLotMapSpot,
  type ParkingLotMapView,
} from '@app/usecases/parking-lot/get-parking-lot-map-usecase.ts';

export interface ParkingLotMapActiveSessionResponse {
  sessionId: string;
  vehicleId: string | null;
  vehicleLicensePlate: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  entryAt: string;
  durationMinutes: number;
}

export interface ParkingLotMapSpotResponse {
  id: string;
  code: string;
  row: number;
  column: number;
  isCovered: boolean;
  spotType: string;
  status: string;
  activeSession: ParkingLotMapActiveSessionResponse | null;
}

export interface ParkingLotMapFloorResponse {
  floor: number;
  grid: { rows: number; columns: number };
  spots: ParkingLotMapSpotResponse[];
}

export interface ParkingLotMapResponse {
  parkingLot: ParkingLotMapView['parkingLot'];
  occupancy: ParkingLotMapView['occupancy'];
  floors: ParkingLotMapFloorResponse[];
}

export const parkingLotMapPresenter = {
  toResponse(view: ParkingLotMapView): ParkingLotMapResponse {
    return {
      parkingLot: view.parkingLot,
      occupancy: view.occupancy,
      floors: view.floors.map(toFloorResponse),
    };
  },
};

function toFloorResponse(floor: ParkingLotMapFloor): ParkingLotMapFloorResponse {
  return {
    floor: floor.floor,
    grid: floor.grid,
    spots: floor.spots.map(toSpotResponse),
  };
}

function toSpotResponse(spot: ParkingLotMapSpot): ParkingLotMapSpotResponse {
  return {
    id: spot.id,
    code: spot.code,
    row: spot.row,
    column: spot.column,
    isCovered: spot.isCovered,
    spotType: spot.spotType,
    status: spot.status,
    activeSession: spot.activeSession ? toActiveSessionResponse(spot.activeSession) : null,
  };
}

function toActiveSessionResponse(
  session: ParkingLotMapActiveSession,
): ParkingLotMapActiveSessionResponse {
  return {
    sessionId: session.sessionId,
    vehicleId: session.vehicleId,
    vehicleLicensePlate: session.vehicleLicensePlate,
    vehicleModel: session.vehicleModel,
    vehicleColor: session.vehicleColor,
    entryAt: session.entryAt.toISOString(),
    durationMinutes: session.durationMinutes,
  };
}
