import { z } from 'zod';

export const MAX_NAME_LENGTH = 200;

export const dutyNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a duty name')
  .max(MAX_NAME_LENGTH, `Use ${MAX_NAME_LENGTH} characters or fewer`);

// Returns an error message, or null when the name is valid
export function validateDutyName(name: string): string | null {
  const result = dutyNameSchema.safeParse(name);

  if (!result.success) {
    return result.error.issues[0].message;
  }

  return null;
}
