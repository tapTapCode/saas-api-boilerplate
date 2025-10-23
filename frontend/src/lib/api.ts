import axios, { AxiosError } from 'axios';
import type {
  User,
  Organization,
  ApiKey,
  UsageStats,
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('access_token', data.access_token);
    return data;
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', registerData);
    localStorage.setItem('access_token', data.access_token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  },

  generateApiKey: async (name?: string): Promise<ApiKey> => {
    const { data } = await api.post<ApiKey>('/auth/api-keys', { name });
    return data;
  },

  revokeApiKey: async (apiKeyId: string): Promise<void> => {
    await api.post(`/auth/api-keys/${apiKeyId}/revoke`, { apiKeyId });
  },
};

// User APIs
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  listApiKeys: async (): Promise<ApiKey[]> => {
    const { data } = await api.get<ApiKey[]>('/users/api-keys');
    return data;
  },
};

// Organization APIs
export const organizationApi = {
  create: async (name: string, slug: string): Promise<Organization> => {
    const { data } = await api.post<Organization>('/organizations', { name, slug });
    return data;
  },

  getById: async (id: string): Promise<Organization> => {
    const { data } = await api.get<Organization>(`/organizations/${id}`);
    return data;
  },

  getUsageStats: async (
    id: string,
    startDate?: string,
    endDate?: string
  ): Promise<UsageStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const { data } = await api.get<UsageStats>(
      `/organizations/${id}/usage?${params.toString()}`
    );
    return data;
  },
};

// Subscription APIs
export const subscriptionApi = {
  createCheckout: async (
    organizationId: string,
    priceId: string
  ): Promise<{ url: string }> => {
    const { data } = await api.post<{ url: string }>('/subscriptions/checkout', {
      organizationId,
      priceId,
    });
    return data;
  },

  cancel: async (organizationId: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/subscriptions/cancel', {
      organizationId,
    });
    return data;
  },
};
