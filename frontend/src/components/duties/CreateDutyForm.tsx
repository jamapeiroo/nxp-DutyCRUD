import { FormEvent, useState } from 'react';
import { MAX_NAME_LENGTH, validateDutyName } from '../../utils/validateDutyName';

interface Props {
  onCreate: (name: string) => Promise<void>;
}

export function CreateDutyForm({ onCreate }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // avoid sending the same duty twice
    if (saving) {
      return;
    }

    const validationError = validateDutyName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onCreate(name.trim());
      setName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="create-form-row">
        <input
          className={error ? 'input input-error' : 'input'}
          placeholder="Add a duty"
          aria-label="Duty name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Adding...' : 'Add duty'}
        </button>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}
