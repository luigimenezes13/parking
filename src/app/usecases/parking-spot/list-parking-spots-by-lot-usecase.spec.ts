import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { ListParkingSpotsByLotUseCase } from '@app/usecases/parking-spot/list-parking-spots-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

describe('ListParkingSpotsByLotUseCase', () => {
  let lots: InMemoryParkingLotRepository;
  let spots: InMemoryParkingSpotRepository;
  let usecase: ListParkingSpotsByLotUseCase;

  beforeEach(() => {
    lots = new InMemoryParkingLotRepository();
    spots = new InMemoryParkingSpotRepository();
    usecase = new ListParkingSpotsByLotUseCase(spots, lots);
  });

  it('returns all active spots for the lot', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await lots.save(lot);

    await spots.save(makeParkingSpot({ parkingLotId: lot.id(), code: 'A1', column: 1 }));
    await spots.save(makeParkingSpot({ parkingLotId: lot.id(), code: 'A2', column: 2 }));

    const found = await usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws ParkingLotNotFoundError when lot is missing', async () => {
    await expect(
      usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
