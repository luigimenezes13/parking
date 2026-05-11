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
import { GetParkingLotMapUseCase } from '@app/usecases/parking-lot/get-parking-lot-map-usecase.ts';
import { RegisterVehicleUseCase } from '@app/usecases/vehicle/register-vehicle-usecase.ts';
import { GetVehicleByIdUseCase } from '@app/usecases/vehicle/get-vehicle-by-id-usecase.ts';
import { ListVehiclesByDriverUseCase } from '@app/usecases/vehicle/list-vehicles-by-driver-usecase.ts';
import { ListVehiclesByLotUseCase } from '@app/usecases/vehicle/list-vehicles-by-lot-usecase.ts';
import { UpdateVehicleAppearanceUseCase } from '@app/usecases/vehicle/update-vehicle-appearance-usecase.ts';
import { TransferVehicleOwnershipUseCase } from '@app/usecases/vehicle/transfer-vehicle-ownership-usecase.ts';
import { DeactivateVehicleUseCase } from '@app/usecases/vehicle/deactivate-vehicle-usecase.ts';
import { CreateParkingSpotUseCase } from '@app/usecases/parking-spot/create-parking-spot-usecase.ts';
import { GetParkingSpotByIdUseCase } from '@app/usecases/parking-spot/get-parking-spot-by-id-usecase.ts';
import { ListParkingSpotsByLotUseCase } from '@app/usecases/parking-spot/list-parking-spots-by-lot-usecase.ts';
import { UpdateParkingSpotMetadataUseCase } from '@app/usecases/parking-spot/update-parking-spot-metadata-usecase.ts';
import { DeactivateParkingSpotUseCase } from '@app/usecases/parking-spot/deactivate-parking-spot-usecase.ts';
import { GetParkingSessionByIdUseCase } from '@app/usecases/parking-session/get-parking-session-by-id-usecase.ts';
import { ListActiveSessionsByLotUseCase } from '@app/usecases/parking-session/list-active-sessions-by-lot-usecase.ts';
import { ListSessionsByVehicleUseCase } from '@app/usecases/parking-session/list-sessions-by-vehicle-usecase.ts';
import { ForceFinishSessionUseCase } from '@app/usecases/parking-session/force-finish-session-usecase.ts';
import { ForcePlateSessionUseCase } from '@app/usecases/parking-session/force-plate-session-usecase.ts';

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
  container.bind<GetParkingLotMapUseCase>(GetParkingLotMapUseCase).toSelf().inTransientScope();

  // Vehicle
  container.bind<RegisterVehicleUseCase>(RegisterVehicleUseCase).toSelf().inTransientScope();
  container.bind<GetVehicleByIdUseCase>(GetVehicleByIdUseCase).toSelf().inTransientScope();
  container
    .bind<ListVehiclesByDriverUseCase>(ListVehiclesByDriverUseCase)
    .toSelf()
    .inTransientScope();
  container.bind<ListVehiclesByLotUseCase>(ListVehiclesByLotUseCase).toSelf().inTransientScope();
  container
    .bind<UpdateVehicleAppearanceUseCase>(UpdateVehicleAppearanceUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<TransferVehicleOwnershipUseCase>(TransferVehicleOwnershipUseCase)
    .toSelf()
    .inTransientScope();
  container.bind<DeactivateVehicleUseCase>(DeactivateVehicleUseCase).toSelf().inTransientScope();

  // ParkingSpot
  container.bind<CreateParkingSpotUseCase>(CreateParkingSpotUseCase).toSelf().inTransientScope();
  container.bind<GetParkingSpotByIdUseCase>(GetParkingSpotByIdUseCase).toSelf().inTransientScope();
  container
    .bind<ListParkingSpotsByLotUseCase>(ListParkingSpotsByLotUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<UpdateParkingSpotMetadataUseCase>(UpdateParkingSpotMetadataUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<DeactivateParkingSpotUseCase>(DeactivateParkingSpotUseCase)
    .toSelf()
    .inTransientScope();

  // ParkingSession
  container
    .bind<GetParkingSessionByIdUseCase>(GetParkingSessionByIdUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<ListActiveSessionsByLotUseCase>(ListActiveSessionsByLotUseCase)
    .toSelf()
    .inTransientScope();
  container
    .bind<ListSessionsByVehicleUseCase>(ListSessionsByVehicleUseCase)
    .toSelf()
    .inTransientScope();
  container.bind<ForceFinishSessionUseCase>(ForceFinishSessionUseCase).toSelf().inTransientScope();
  container.bind<ForcePlateSessionUseCase>(ForcePlateSessionUseCase).toSelf().inTransientScope();
}
