import { pool } from '../config/database';
import { Duty } from './models/duty.model';

// Data access layer: the only place that knows about SQL

export async function findAll(): Promise<Duty[]> {
  const result = await pool.query<Duty>('SELECT id, name FROM duties.duties ORDER BY name');
  return result.rows;
}

export async function create(name: string): Promise<Duty> {
  const result = await pool.query<Duty>(
    'INSERT INTO duties.duties (name) VALUES ($1) RETURNING id, name',
    [name]
  );
  return result.rows[0];
}

// Returns null when there is no duty with that id
export async function update(id: string, name: string): Promise<Duty | null> {
  const result = await pool.query<Duty>(
    'UPDATE duties.duties SET name = $1 WHERE id = $2 RETURNING id, name',
    [name, id]
  );
  return result.rows[0] ?? null;
}

// Returns false when there is no duty with that id
export async function remove(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM duties.duties WHERE id = $1', [id]);
  return result.rowCount === 1;
}
