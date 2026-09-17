import { CreateDutyForm } from './components/duties/CreateDutyForm';
import { DutiesList } from './components/duties/DutiesList';
import { useDuties } from './hooks/useDuties';

export default function App() {
  const { duties, loading, error, reload, addDuty, editDuty, removeDuty } = useDuties();

  return (
    <main className="container">
      <p className="eyebrow">Duty CRUD</p>
      <h1>Duties</h1>
      <p className="intro">Create, update and delete your duties.</p>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="button" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      <CreateDutyForm onCreate={addDuty} />

      {/* If the list could not be loaded, "No duties yet" would be misleading */}
      {!error && <DutiesList duties={duties} loading={loading} onUpdate={editDuty} onDelete={removeDuty} />}
    </main>
  );
}
