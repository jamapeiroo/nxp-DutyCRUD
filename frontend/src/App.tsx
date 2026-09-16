import { CreateDutyForm } from './components/duties/CreateDutyForm';
import { DutiesList } from './components/duties/DutiesList';
import { useDuties } from './hooks/useDuties';

export default function App() {
  const { duties, loading, error, addDuty, editDuty, removeDuty } = useDuties();

  return (
    <main className="container">
      <p className="eyebrow">Duty CRUD</p>
      <h1>Duties</h1>
      <p className="intro">Create, update and delete your duties.</p>

      {error && <p className="error-banner" role="alert">{error}</p>}

      <CreateDutyForm onCreate={addDuty} />
      <DutiesList duties={duties} loading={loading} onUpdate={editDuty} onDelete={removeDuty} />
    </main>
  );
}
