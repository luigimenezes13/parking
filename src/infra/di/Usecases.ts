import { type Container } from 'inversify';

import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';

export function configureUseCases(container: Container): void {
  container.bind<RegisterDriverUseCase>(RegisterDriverUseCase).toSelf().inTransientScope();
  container.bind<GetDriverByIdUseCase>(GetDriverByIdUseCase).toSelf().inTransientScope();
  container.bind<ListDriversUseCase>(ListDriversUseCase).toSelf().inTransientScope();
  container.bind<UpdateDriverInfoUseCase>(UpdateDriverInfoUseCase).toSelf().inTransientScope();
  container.bind<DeactivateDriverUseCase>(DeactivateDriverUseCase).toSelf().inTransientScope();
}
