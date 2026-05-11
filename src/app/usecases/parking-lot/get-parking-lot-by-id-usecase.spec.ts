import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { GetParkingLotByIdUseCase } from '@app/usecases/parking-lot/get-parking-lot-by-id-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

describe('GetParkingLotByIdUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let usecase: GetParkingLotByIdUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    usecase = new GetParkingLotByIdUseCase(parkingLots);
  });

  it('returns the parking lot when found', async () => {
    const lot = ParkingLot.register({ name: 'Lot A', address: 'addr', totalCapacity: 10 });
    await parkingLots.save(lot);

    const found = await usecase.execute({ parkingLotId: lot.id().value() });

    expect(found.id().equals(lot.id())).toBe(true);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
