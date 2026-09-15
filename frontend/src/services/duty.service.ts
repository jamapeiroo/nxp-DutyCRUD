import { Duty } from '../types/duty';
import { apiRequest } from './api-client';

export function getDuties() {
  return apiRequest<Duty[]>('/duties');
}

export function createDuty(name: string) {
  return apiRequest<Duty>('/duties', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export function updateDuty(id: string, name: string) {
  return apiRequest<Duty>(`/duties/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
}

export function deleteDuty(id: string) {
  return apiRequest<void>(`/duties/${id}`, {
    method: 'DELETE'
  });
}
