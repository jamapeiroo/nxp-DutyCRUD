import { z } from 'zod';
import { AppError } from '../errors/app-error';

// Checks data against a zod schema.
// Returns the parsed data (e.g. with the name already trimmed) or throws a 400 error with the first message.
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(400, result.error.issues[0].message);
  }

  return result.data;
}
