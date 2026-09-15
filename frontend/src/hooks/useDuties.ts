import { useEffect, useState } from 'react';
import { createDuty, deleteDuty, getDuties, updateDuty } from '../services/duty.service';
import { Duty } from '../types/duty';

function sortByName(duties: Duty[]) {
  return [...duties].sort((a, b) => a.name.localeCompare(b.name));
}

// Keeps the list of duties and updates it after every change,
// so the components never have to reload the page
export function useDuties() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDuties()
      .then((data) => setDuties(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function addDuty(name: string) {
    const newDuty = await createDuty(name);
    setDuties((current) => sortByName([...current, newDuty]));
  }

  async function editDuty(id: string, name: string) {
    const updatedDuty = await updateDuty(id, name);
    setDuties((current) => sortByName(current.map((duty) => (duty.id === id ? updatedDuty : duty))));
  }

  async function removeDuty(id: string) {
    await deleteDuty(id);
    setDuties((current) => current.filter((duty) => duty.id !== id));
  }

  return { duties, loading, error, addDuty, editDuty, removeDuty };
}
