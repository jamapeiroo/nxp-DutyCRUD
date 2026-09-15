import { Duty } from '../../types/duty';
import { DutyItem } from './DutyItem';

interface Props {
  duties: Duty[];
  loading: boolean;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DutiesList({ duties, loading, onUpdate, onDelete }: Props) {
  if (loading) {
    return <p className="loading">Loading duties...</p>;
  }

  return (
    <section>
      <h2>Current duties</h2>

      {duties.length === 0 && <p className="empty">No duties yet</p>}

      {duties.length > 0 && (
        <ul className="duty-list">
          {duties.map((duty) => (
            <DutyItem key={duty.id} duty={duty} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
