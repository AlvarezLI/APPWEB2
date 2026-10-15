/* NUVEA — Configuración y función base para todas las peticiones al back-end */

export const API_URL = 'http://localhost:3000/api';

// Hace el fetch, arma headers/body y convierte las respuestas de error en excepciones
export async function request(endpoint, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_URL + endpoint, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('No se pudo conectar con el servidor.'), { status: 0 });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Error ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  return data;
}
