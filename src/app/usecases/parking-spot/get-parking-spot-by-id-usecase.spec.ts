import { beforeEach, describe, expect, it } from 'vitest';

import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { GetParkingSpotByIdUseCase } from '@app/usecases/parking-spot/get-parking-spot-by-id-usecase.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';

interface Setup {
  spots: InMemoryParkingSpotRepository;
  usecase: GetParkingSpotByIdUseCase;
}

async function makeSetup(): Promise<Setup> {
  const spots = new InMemoryParkingSpotRepository();
  const usecase = new GetParkingSpotByIdUseCase(spots);
  return { spots, usecase };
}

describe('GetParkingSpotByIdUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns the spot when found', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    await setup.spots.save(spot);

    const found = await setup.usecase.execute({ parkingSpotId: spot.id().value() });

    expect(found.id().equals(spot.id())).toBe(true);
  });

  it('throws ParkingSpotNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ parkingSpotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });
});
