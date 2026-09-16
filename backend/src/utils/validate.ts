import { z } from 'zod';
import { AppError } from '../errors/app-error';

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(400, result.error.issues[0].message);
  }

  return result.data;
}
