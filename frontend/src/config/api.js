// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  GOOGLE: `${API_BASE_URL}/api/auth/google`,
  GOOGLE_CALLBACK: `${API_BASE_URL}/api/auth/google/callback`,
  VERIFY_EMAIL: (token) => `${API_BASE_URL}/api/auth/verify-email/${token}`,
  RESEND_VERIFICATION: `${API_BASE_URL}/api/auth/resend-verification`,
  
  // Business endpoints
  BUSINESSES: `${API_BASE_URL}/api/auth/businesses`,
  BUSINESS: (id) => `${API_BASE_URL}/api/auth/business/${id}`,
  SWITCH_BUSINESS: (id) => `${API_BASE_URL}/api/auth/business/${id}/switch`,
  
  // Sales endpoints
  SALES_SUMMARY: `${API_BASE_URL}/api/sales/summary`,
  SALES_LIST: `${API_BASE_URL}/api/sales/list`,

  // Notification endpoints
  NOTIFICATIONS: (page = 1, limit = 20) => `${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`,
  NOTIFICATION: (id) => `${API_BASE_URL}/api/notifications/${id}`,
  NOTIFICATIONS_MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/api/notifications/read-all`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,

  // Health check
  HEALTH: `${API_BASE_URL}/api/health`
};

export default API_BASE_URL;
