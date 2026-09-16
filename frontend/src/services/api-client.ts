import { API_URL } from '../config/env';

// Shared fetch helper for every service
// It always checks response.ok and turns backend errors into an Error with a readable message.
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(API_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    throw new Error('Could not connect to the server');
  }

  // Some responses have no body (for example 204 after a delete)
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // The backend sends errors as { error: 'message' }
    throw new Error(data?.error ?? 'Something went wrong, please try again');
  }

  return data;
}
