import { type Driver } from '@domain/parking/entities/driver.ts';

export interface DriverResponse {
  id: string;
  cnh: string;
  name: string;
  email: string;
  phone: string;
  deactivatedAt: string | null;
}

export const driverPresenter = {
  toResponse(driver: Driver): DriverResponse {
    return {
      id: driver.id().value(),
      cnh: driver.cnh(),
      name: driver.name(),
      email: driver.email(),
      phone: driver.phone(),
      deactivatedAt: driver.deactivatedAt()?.toISOString() ?? null,
    };
  },
};
