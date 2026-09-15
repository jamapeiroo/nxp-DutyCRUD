import { dutyBodySchema, dutyIdSchema } from '../../duties/duties.validation';
import { AppError } from '../../errors/app-error';
import { validate } from '../../utils/validate';

describe('dutyBodySchema', () => {
  it.each([null, undefined, '', '   '])('rejects empty name %p', (name) => {
    expect(() => validate(dutyBodySchema, { name })).toThrow('Name');
  });

  it('rejects a missing body', () => {
    expect(() => validate(dutyBodySchema, undefined)).toThrow('Name is required');
  });

  it('rejects a name that is not a text', () => {
    expect(() => validate(dutyBodySchema, { name: 123 })).toThrow('Name must be a text');
  });

  it('rejects names longer than 200 characters', () => {
    expect(() => validate(dutyBodySchema, { name: 'a'.repeat(201) })).toThrow('200 characters or fewer');
  });

  it('accepts a name of exactly 200 characters', () => {
    expect(validate(dutyBodySchema, { name: 'a'.repeat(200) }).name).toHaveLength(200);
  });

  it('trims valid names', () => {
    expect(validate(dutyBodySchema, { name: '  Plan review  ' }).name).toBe('Plan review');
  });
});

describe('dutyIdSchema', () => {
  it('rejects malformed ids', () => {
    expect(() => validate(dutyIdSchema, 'not-an-id')).toThrow('valid UUID');
  });

  it('rejects a 36 character string that is not a UUID', () => {
    expect(() => validate(dutyIdSchema, 'x'.repeat(36))).toThrow('valid UUID');
  });

  it('rejects a UUID with extra characters', () => {
    expect(() => validate(dutyIdSchema, '550e8400-e29b-41d4-a716-446655440000x')).toThrow('valid UUID');
  });

  it('accepts a real UUID', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(validate(dutyIdSchema, id)).toBe(id);
  });
});

describe('validate', () => {
  it('throws an AppError with status 400', () => {
    expect.assertions(2);

    try {
      validate(dutyIdSchema, 'not-an-id');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
    }
  });
});
