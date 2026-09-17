import { FormEvent, useState } from 'react';
import { Duty } from '../../types/duty';
import { MAX_NAME_LENGTH, validateDutyName } from '../../utils/validateDutyName';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  duty: Duty;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DutyItem({ duty, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(duty.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEditing() {
    setName(duty.name);
    setError('');
    setEditing(true);
  }

  function cancelEditing() {
    setError('');
    setEditing(false);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();

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
      await onUpdate(duty.id, name.trim());
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      // if it works the item disappears from the list
      await onDelete(duty.id);
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (editing) {
    return (
      <li className="duty-item">
        <form className="duty-row" onSubmit={handleSave}>
          <input
            autoFocus
            className={error ? 'input input-error' : 'input'}
            aria-label="New duty name"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="button" disabled={saving} onClick={cancelEditing}>
            Cancel
          </button>
        </form>

        {error && <p className="field-error" role="alert">{error}</p>}
      </li>
    );
  }

  return (
    <li className="duty-item">
      <div className="duty-row">
        <span className="duty-name">{duty.name}</span>
        <button type="button" className="button" aria-label={`Edit ${duty.name}`} onClick={startEditing}>
          Edit
        </button>
        <button
          type="button"
          className="button button-danger"
          aria-label={`Delete ${duty.name}`}
          disabled={deleting}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </button>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete duty?"
          message={`"${duty.name}" will be deleted permanently.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </li>
  );
}
