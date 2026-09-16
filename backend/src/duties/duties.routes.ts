import { Router } from 'express';
import * as dutiesController from './duties.controller';

// Express sends errors thrown in async handlers to the error handler middleware
export const dutiesRouter = Router();

dutiesRouter.get('/', dutiesController.getDuties);
dutiesRouter.post('/', dutiesController.createDuty);
dutiesRouter.put('/:id', dutiesController.updateDuty);
dutiesRouter.delete('/:id', dutiesController.deleteDuty);
