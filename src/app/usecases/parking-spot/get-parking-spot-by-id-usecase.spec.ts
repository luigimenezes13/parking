import { beforeEach, describe, expect, it } from 'vitest';

import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { GetParkingSpotByIdUseCase } from '@app/usecases/parking-spot/get-parking-spot-by-id-usecase.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';

describe('GetParkingSpotByIdUseCase', () => {
  let spots: InMemoryParkingSpotRepository;
  let usecase: GetParkingSpotByIdUseCase;

  beforeEach(() => {
    spots = new InMemoryParkingSpotRepository();
    usecase = new GetParkingSpotByIdUseCase(spots);
  });

  it('returns the spot when found', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    await spots.save(spot);

    const found = await usecase.execute({ parkingSpotId: spot.id().value() });

    expect(found.id().equals(spot.id())).toBe(true);
  });

  it('throws ParkingSpotNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ parkingSpotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });
});
