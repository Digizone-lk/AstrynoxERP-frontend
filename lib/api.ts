import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/lib/token";

const api = axios.create({
  baseURL: "",
  withCredentials: true, // send HttpOnly refresh_token cookie on /api/auth/refresh
  headers: { "Content-Type": "application/json" },
});

// Inject Authorization: Bearer from memory on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(null)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        // No Authorization header needed — proxy forwards the HttpOnly
        // refresh_token cookie to the backend automatically
        const { data } = await api.post("/api/auth/refresh");
        setAccessToken(data.access_token);
        processQueue(null);
        return api(original);
      } catch (err) {
        processQueue(err);
        clearAccessToken();
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.replace("/login?next=" + encodeURIComponent(window.location.pathname));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  register: (data: {
    org_name: string;
    org_slug: string;
    currency: string;
    full_name: string;
    email: string;
    password: string;
  }) => api.post("/api/auth/register", data),
  refreshToken: () => api.post("/api/auth/refresh"),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get("/api/auth/me"),
};

export const clientsApi = {
  list: () => api.get("/api/clients"),
  create: (data: object) => api.post("/api/clients", data),
  get: (id: string) => api.get(`/api/clients/${id}`),
  update: (id: string, data: object) => api.patch(`/api/clients/${id}`, data),
  getEligibleProducts: (clientId: string) =>
    api.get(`/api/clients/${clientId}/products`),
  listAssignedProducts: (clientId: string) =>
    api.get(`/api/clients/${clientId}/assigned-products`),
  assignProduct: (clientId: string, productId: string) =>
    api.post(`/api/clients/${clientId}/assigned-products`, { product_id: productId }),
  unassignProduct: (clientId: string, productId: string) =>
    api.delete(`/api/clients/${clientId}/assigned-products/${productId}`),
};

export const productsApi = {
  list: (params?: { is_global?: boolean }) => api.get("/api/products", { params }),
  create: (data: object) => api.post("/api/products", data),
  get: (id: string) => api.get(`/api/products/${id}`),
  update: (id: string, data: object) => api.patch(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  getAssignedClients: (productId: string) => api.get(`/api/products/${productId}/assigned-clients`),
};

export const quotationsApi = {
  list: (params?: object) => api.get("/api/quotations", { params }),
  nextNumber: () => api.get<{ quote_number: string }>("/api/quotations/next-number"),
  create: (data: object) => api.post("/api/quotations", data),
  get: (id: string) => api.get(`/api/quotations/${id}`),
  update: (id: string, data: object) => api.patch(`/api/quotations/${id}`, data),
  send: (id: string) => api.post(`/api/quotations/${id}/send`),
  approve: (id: string) => api.post(`/api/quotations/${id}/approve`),
  reject: (id: string) => api.post(`/api/quotations/${id}/reject`),
  convertToInvoice: (id: string) =>
    api.post(`/api/quotations/${id}/convert-to-invoice`),
  downloadPdf: (id: string) =>
    api.get(`/api/quotations/${id}/pdf`, { responseType: "blob" }),
};

export const invoicesApi = {
  list: (params?: object) => api.get("/api/invoices", { params }),
  nextNumber: () => api.get<{ invoice_number: string }>("/api/invoices/next-number"),
  create: (data: object) => api.post("/api/invoices", data),
  get: (id: string) => api.get(`/api/invoices/${id}`),
  update: (id: string, data: object) => api.patch(`/api/invoices/${id}`, data),
  send: (id: string) => api.post(`/api/invoices/${id}/send`),
  markPaid: (id: string) => api.post(`/api/invoices/${id}/mark-paid`),
  markOverdue: (id: string) => api.post(`/api/invoices/${id}/mark-overdue`),
  cancel: (id: string) => api.post(`/api/invoices/${id}/cancel`),
  downloadPdf: (id: string) =>
    api.get(`/api/invoices/${id}/pdf`, { responseType: "blob" }),
};

export const dashboardApi = {
  stats: () => api.get("/api/dashboard/stats"),
};

export const reportsApi = {
  summary: (period: string) => api.get("/api/reports/summary", { params: { period } }),
};

export const usersApi = {
  list: () => api.get("/api/users"),
  create: (data: object) => api.post("/api/users", data),
  update: (id: string, data: object) => api.patch(`/api/users/${id}`, data),
  resetPassword: (id: string, new_password: string) =>
    api.post(`/api/users/${id}/reset-password`, { new_password }),
  deactivate: (id: string) => api.post(`/api/users/${id}/deactivate`),
  reactivate: (id: string) => api.post(`/api/users/${id}/reactivate`),
  getActivity: (id: string, params?: { skip?: number; limit?: number }) =>
    api.get(`/api/users/${id}/activity`, { params }),
};

export const profileApi = {
  get: () => api.get("/api/users/me/profile"),
  update: (data: object) => api.patch("/api/users/me/profile", data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/api/users/me/change-password", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteAvatar: () => api.delete("/api/users/me/avatar"),
  getSessions: () => api.get("/api/users/me/sessions"),
  revokeSession: (id: string) => api.delete(`/api/users/me/sessions/${id}`),
  revokeAllSessions: () => api.delete("/api/users/me/sessions"),
  getNotifications: () => api.get("/api/users/me/notifications"),
  updateNotifications: (data: object) => api.patch("/api/users/me/notifications", data),
  getActivity: (params?: { skip?: number; limit?: number }) =>
    api.get("/api/users/me/activity", { params }),
};

export const auditApi = {
  list: (params?: object) => api.get("/api/audit", { params }),
};

// Separate axios instance — no baseURL or credentials — for external CDN calls
const cdnAxios = axios.create();

export const exchangeRatesApi = {
  getRates: (baseCurrency: string) => {
    const base = baseCurrency.toLowerCase();
    return cdnAxios
      .get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`)
      .catch(() =>
        cdnAxios.get(`https://currency-api.pages.dev/v1/currencies/${base}.json`)
      );
  },
};
