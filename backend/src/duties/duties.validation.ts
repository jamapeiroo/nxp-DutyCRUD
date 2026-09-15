import { z } from 'zod';

export const MAX_NAME_LENGTH = 200;

// Body for POST /api/duties and PUT /api/duties/:id
export const dutyBodySchema = z.object(
  {
    name: z
      .string({ required_error: 'Name is required', invalid_type_error: 'Name must be a text' })
      .trim()
      .min(1, 'Name is required')
      .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer`)
  },
  { required_error: 'Name is required' }
);

export const dutyIdSchema = z.string().uuid('Duty id must be a valid UUID');
