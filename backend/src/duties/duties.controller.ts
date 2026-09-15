import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import * as dutiesService from './duties.service';
import { dutyBodySchema, dutyIdSchema } from './duties.validation';

// HTTP layer: reads the request, validates it and sends the response

export async function getDuties(_req: Request, res: Response) {
  const duties = await dutiesService.getAllDuties();
  res.json(duties);
}

export async function createDuty(req: Request, res: Response) {
  const { name } = validate(dutyBodySchema, req.body);

  const duty = await dutiesService.createDuty(name);
  res.status(201).json(duty);
}

export async function updateDuty(req: Request<{ id: string }>, res: Response) {
  const id = validate(dutyIdSchema, req.params.id);
  const { name } = validate(dutyBodySchema, req.body);

  const duty = await dutiesService.updateDuty(id, name);
  res.json(duty);
}

export async function deleteDuty(req: Request<{ id: string }>, res: Response) {
  const id = validate(dutyIdSchema, req.params.id);

  await dutiesService.deleteDuty(id);
  res.status(204).send();
}
