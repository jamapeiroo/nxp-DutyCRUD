import { AppError } from '../errors/app-error';
import { logger } from '../logger/logger';
import * as dutiesRepository from './duties.repository';
import { Duty } from './models/duty.model';

// Business logic layer: doesn't know about HTTP requests or SQL

export async function getAllDuties(): Promise<Duty[]> {
  return dutiesRepository.findAll();
}

export async function createDuty(name: string): Promise<Duty> {
  const duty = await dutiesRepository.create(name);
  logger.info({ dutyId: duty.id }, 'Duty created');
  return duty;
}

export async function updateDuty(id: string, name: string): Promise<Duty> {
  const duty = await dutiesRepository.update(id, name);

  if (!duty) {
    throw new AppError(404, 'Duty not found');
  }

  logger.info({ dutyId: id }, 'Duty updated');
  return duty;
}

export async function deleteDuty(id: string): Promise<void> {
  const deleted = await dutiesRepository.remove(id);

  if (!deleted) {
    throw new AppError(404, 'Duty not found');
  }

  logger.info({ dutyId: id }, 'Duty deleted');
}
