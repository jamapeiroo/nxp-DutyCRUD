import { validateDutyName } from '../../utils/validateDutyName';

describe('validateDutyName', () => {
  it.each(['', '   '])('rejects an empty name %p', (name) => {
    expect(validateDutyName(name)).toBe('Enter a duty name');
  });

  it('rejects names longer than 200 characters', () => {
    expect(validateDutyName('a'.repeat(201))).toBe('Use 200 characters or fewer');
  });

  it('ignores spaces around the name when checking the length', () => {
    expect(validateDutyName(`  ${'a'.repeat(200)}  `)).toBeNull();
  });

  it('accepts a valid name', () => {
    expect(validateDutyName('Plan release')).toBeNull();
  });
});
