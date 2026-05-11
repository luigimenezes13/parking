import { type Container } from 'inversify';

import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';
import { CreateParkingLotUseCase } from '@app/usecases/parking-lot/create-parking-lot-usecase.ts';
import { GetParkingLotByIdUseCase } from '@app/usecases/parking-lot/get-parking-lot-by-id-usecase.ts';
import { ListParkingLotsUseCase } from '@app/usecases/parking-lot/list-parking-lots-usecase.ts';
import { UpdateParkingLotInfoUseCase } from '@app/usecases/parking-lot/update-parking-lot-info-usecase.ts';
import { DeactivateParkingLotUseCase } from '@app/usecases/parking-lot/deactivate-parking-lot-usecase.ts';

export function configureUseCases(container: Container): void {
  // Driver
  container.bind<RegisterDriverUseCase>(RegisterDriverUseCase).toSelf().inTransientScope();
  container.bind<GetDriverByIdUseCase>(GetDriverByIdUseCase).toSelf().inTransientScope();
  container.bind<ListDriversUseCase>(ListDriversUseCase).toSelf().inTransientScope();
  container.bind<UpdateDriverInfoUseCase>(UpdateDriverInfoUseCase).toSelf().inTransientScope();
  container.bind<DeactivateDriverUseCase>(DeactivateDriverUseCase).toSelf().inTransientScope();

  // ParkingLot
  container.bind<CreateParkingLotUseCase>(CreateParkingLotUseCase).toSelf().inTransientScope();
  container.bind<GetParkingLotByIdUseCase>(GetParkingLotByIdUseCase).toSelf().inTransientScope();
  container.bind<ListParkingLotsUseCase>(ListParkingLotsUseCase).toSelf().inTransientScope();
  container
    .bind<UpdateParkingLotInfoUseCase>(UpdateParkingLotInfoUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<DeactivateParkingLotUseCase>(DeactivateParkingLotUseCase)
    .toSelf()
    .inTransientScope();
}
