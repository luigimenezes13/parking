import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

export interface GetParkingLotMapInput {
  parkingLotId: string;
  now?: Date;
}

export interface ParkingLotMapView {
  parkingLot: {
    id: string;
    name: string;
    address: string;
    totalCapacity: number;
  };
  occupancy: {
    free: number;
    occupied: number;
    reserved: number;
    total: number;
  };
  floors: ParkingLotMapFloor[];
}

export interface ParkingLotMapFloor {
  floor: number;
  grid: { rows: number; columns: number };
  spots: ParkingLotMapSpot[];
}

export interface ParkingLotMapSpot {
  id: string;
  code: string;
  row: number;
  column: number;
  isCovered: boolean;
  spotType: string;
  status: string;
  activeSession: ParkingLotMapActiveSession | null;
}

export interface ParkingLotMapActiveSession {
  sessionId: string;
  vehicleId: string | null;
  vehicleLicensePlate: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  entryAt: Date;
  durationMinutes: number;
}

@injectable()
export class GetParkingLotMapUseCase implements UseCase<GetParkingLotMapInput, ParkingLotMapView> {
  private readonly parkingLots: ParkingLotRepository;
  private readonly spots: ParkingSpotRepository;
  private readonly sessions: ParkingSessionRepository;

  constructor(
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
    @inject(TYPES.ParkingSpotRepository) spots: ParkingSpotRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
  ) {
    this.parkingLots = parkingLots;
    this.spots = spots;
    this.sessions = sessions;
  }

  async execute(input: GetParkingLotMapInput): Promise<ParkingLotMapView> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);
    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    const [spots, sessions] = await Promise.all([
      this.spots.findByParkingLot(parkingLotId),
      this.sessions.findActiveByLot(parkingLotId),
    ]);

    const sessionsBySpotId = this.indexSessionsBySpotId(sessions);
    const now = input.now ?? new Date();
    const floors = this.groupSpotsByFloor(spots, sessionsBySpotId, now);
    const occupancy = this.computeOccupancy(spots);

    return {
      parkingLot: this.toParkingLotView(parkingLot),
      occupancy,
      floors,
    };
  }

  private toParkingLotView(parkingLot: ParkingLot): ParkingLotMapView['parkingLot'] {
    return {
      id: parkingLot.id().value(),
      name: parkingLot.name(),
      address: parkingLot.address(),
      totalCapacity: parkingLot.totalCapacity(),
    };
  }

  private indexSessionsBySpotId(sessions: ParkingSession[]): Map<string, ParkingSession> {
    const map = new Map<string, ParkingSession>();
    for (const session of sessions) {
      const spot = session.spot();
      if (spot) {
        map.set(spot.id().value(), session);
      }
    }
    return map;
  }

  private groupSpotsByFloor(
    spots: ParkingSpot[],
    sessionsBySpotId: Map<string, ParkingSession>,
    now: Date,
  ): ParkingLotMapFloor[] {
    const floorBuckets = new Map<number, ParkingSpot[]>();
    for (const spot of spots) {
      const bucket = floorBuckets.get(spot.floor()) ?? [];
      bucket.push(spot);
      floorBuckets.set(spot.floor(), bucket);
    }

    const floors: ParkingLotMapFloor[] = [];
    for (const [floor, floorSpots] of floorBuckets) {
      floors.push(this.buildFloorView(floor, floorSpots, sessionsBySpotId, now));
    }
    floors.sort((left, right) => left.floor - right.floor);
    return floors;
  }

  private buildFloorView(
    floor: number,
    floorSpots: ParkingSpot[],
    sessionsBySpotId: Map<string, ParkingSession>,
    now: Date,
  ): ParkingLotMapFloor {
    const rows = floorSpots.reduce((max, spot) => Math.max(max, spot.row()), 0);
    const columns = floorSpots.reduce((max, spot) => Math.max(max, spot.column()), 0);

    const spotViews = floorSpots
      .slice()
      .sort((left, right) => left.row() - right.row() || left.column() - right.column())
      .map((spot) => this.toSpotView(spot, sessionsBySpotId.get(spot.id().value()) ?? null, now));

    return {
      floor,
      grid: { rows, columns },
      spots: spotViews,
    };
  }

  private toSpotView(
    spot: ParkingSpot,
    session: ParkingSession | null,
    now: Date,
  ): ParkingLotMapSpot {
    return {
      id: spot.id().value(),
      code: spot.code().value(),
      row: spot.row(),
      column: spot.column(),
      isCovered: spot.isCovered(),
      spotType: spot.spotType().serialize(),
      status: spot.status().serialize(),
      activeSession: session ? this.toActiveSessionView(session, now) : null,
    };
  }

  private toActiveSessionView(session: ParkingSession, now: Date): ParkingLotMapActiveSession {
    const vehicle = session.vehicle();
    const entryAt = session.entryAt();
    const durationMinutes = Math.max(0, Math.floor((now.getTime() - entryAt.getTime()) / 60000));

    return {
      sessionId: session.id().value(),
      vehicleId: vehicle?.id().value() ?? null,
      vehicleLicensePlate: vehicle?.licensePlate().value() ?? null,
      vehicleModel: vehicle?.model() ?? null,
      vehicleColor: vehicle?.color() ?? null,
      entryAt,
      durationMinutes,
    };
  }

  private computeOccupancy(spots: ParkingSpot[]): ParkingLotMapView['occupancy'] {
    const occupancy = { free: 0, occupied: 0, reserved: 0, total: spots.length };
    for (const spot of spots) {
      if (spot.isFree()) {
        occupancy.free += 1;
      } else if (spot.isOccupied()) {
        occupancy.occupied += 1;
      } else if (spot.isReserved()) {
        occupancy.reserved += 1;
      }
    }
    return occupancy;
  }
}
