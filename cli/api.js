import axios from 'axios';
import { getToken } from './auth.js';

const API_BASE = process.env.SMRITI_API_URL || 'http://localhost:8080/api';

export function createApi() {
  const token = getToken();
  if (!token) {
    throw new Error('Not logged in. Run `smriti login` first.');
  }

  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  client.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        throw new Error('Session expired or invalid. Please run `smriti login` again.');
      }
      const msg = error.response?.data?.message || error.message;
      throw new Error(msg);
    }
  );

  return client;
}

export const publicApi = axios.create({
  baseURL: API_BASE
});
