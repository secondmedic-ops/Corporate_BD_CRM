import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, UserDto } from '../types/api';
import { AppError, toast } from '../utils/errors';
import { mockAdapter } from './mock/adapter';

// Mock mode can be driven by localStorage or env
const getInitialMockMode = (): boolean => {
  const saved = localStorage.getItem('sm_crm_mock_mode');
  if (saved !== null) return saved === 'true';
  return import.meta.env.VITE_USE_MOCK_API !== 'false';
};

export let isMockMode = getInitialMockMode();
export let simulateServerError = false;

export const setMockMode = (value: boolean) => {
  isMockMode = value;
  localStorage.setItem('sm_crm_mock_mode', String(value));
};

export const setSimulateServerError = (value: boolean) => {
  simulateServerError = value;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('sm_crm_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success && body.error) {
        const appErr = new AppError(body.error);
        toast.error(appErr.getFormattedMessage(), appErr.code);
        throw appErr;
      }
      return body.data !== undefined ? body.data : body;
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const resData = error.response?.data as ApiResponse<unknown> | undefined;
    if (error.response?.status === 401 && resData?.error?.code === 'TOKEN_EXPIRED') {
      try {
        const refreshToken = localStorage.getItem('sm_crm_refresh_token');
        if (refreshToken) {
          const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = refreshRes.data?.data?.accessToken;
          if (newAccessToken) {
            localStorage.setItem('sm_crm_access_token', newAccessToken);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newAccessToken}`;
              return axiosClient(error.config);
            }
          }
        }
      } catch {
        localStorage.removeItem('sm_crm_access_token');
        localStorage.removeItem('sm_crm_refresh_token');
        window.location.href = '/login';
      }
    }

    if (resData?.error) {
      const appErr = new AppError(resData.error);
      toast.error(appErr.getFormattedMessage(), appErr.code);
      throw appErr;
    }

    const genericErr = new AppError({
      code: 'SERVER_ERROR',
      message: error.message || 'An unexpected network error occurred',
    });
    toast.error(genericErr.message, 'Network Error');
    throw genericErr;
  }
);

/**
 * Universal request wrapper that delegates to either the in-memory MockAdapter
 * or to the live Axios REST client based on isMockMode.
 */
export async function apiCall<T>(
  mockFn: () => Promise<T>,
  networkFn: () => Promise<T>,
  successToast?: string
): Promise<T> {
  if (isMockMode) {
    // Artificial latency 200-350ms
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));
    if (simulateServerError) {
      const err = new AppError({
        code: 'SERVER_ERROR',
        message: 'Simulated 500 Server Error from Mock Toggle',
      });
      toast.error(err.message, err.code);
      throw err;
    }
    try {
      const result = await mockFn();
      if (successToast) {
        toast.success(successToast);
      }
      return result;
    } catch (err: unknown) {
      if (err instanceof AppError) {
        toast.error(err.getFormattedMessage(), err.code);
        throw err;
      }
      const generic = new AppError({
        code: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Unknown mock error',
      });
      toast.error(generic.message, generic.code);
      throw generic;
    }
  }

  try {
    const result = await networkFn();
    if (successToast) {
      toast.success(successToast);
    }
    return result;
  } catch (err) {
    throw err;
  }
}
