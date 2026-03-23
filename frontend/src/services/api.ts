import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  let token: string | null = null;
  
  if (Platform.OS === 'web') {
    token = localStorage.getItem('token');
  } else {
    token = await SecureStore.getItemAsync('token');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; user_type: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getUser: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

// Freelancers API
export const freelancersApi = {
  getFreelancers: (params: {
    category?: string;
    subcategories?: string;
    min_price?: number;
    max_price?: number;
    lat?: number;
    lng?: number;
    max_distance_minutes?: number;
    search?: string;
    exclude_user_id?: string;
    skip?: number;
    limit?: number;
  }) => api.get('/freelancers', { params }),
  getFreelancer: (id: string) => api.get(`/freelancers/${id}`),
  getProfileBySlug: (slug: string) => api.get(`/p/${slug}`),
};

// Portfolio API
export const portfolioApi = {
  getMyPortfolio: () => api.get('/portfolio'),
  createItem: (data: any) => api.post('/portfolio', data),
  addPortfolioItem: (data: any) => api.post('/portfolio', data),
  deleteItem: (id: string) => api.delete(`/portfolio/${id}`),
  deletePortfolioItem: (id: string) => api.delete(`/portfolio/${id}`),
};

// Services API
export interface ServiceOption {
  id?: string;
  name: string;
  price: number;
  description?: string;
}

export interface ServiceCreate {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  price_unit?: string;
  duration_hours: number;
  images?: string[];
  options?: ServiceOption[];
}

export const servicesApi = {
  getMyServices: () => api.get('/services'),
  getService: (id: string) => api.get(`/services/${id}`),
  createService: (data: ServiceCreate) => api.post('/services', data),
  updateService: (id: string, data: ServiceCreate) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
  getServiceLimits: () => api.get('/services/limits/info'),
};

// Bookings API
export const bookingsApi = {
  getMyBookings: () => api.get('/bookings'),
  createBooking: (data: { service_id: string; date: string; notes?: string; selected_options?: string[] }) =>
    api.post('/bookings', data),
  updateBooking: (id: string, data: { date?: string; notes?: string }) =>
    api.put(`/bookings/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/bookings/${id}/status?status=${status}`),
  cancelBooking: (id: string) =>
    api.post(`/bookings/${id}/cancel`),
};

// Payments API
export const paymentsApi = {
  processPayment: (bookingId: string) =>
    api.post(`/payments/${bookingId}/pay`),
  createStripeCheckout: (bookingId: string, originUrl: string) =>
    api.post('/stripe/checkout', { booking_id: bookingId, origin_url: originUrl }),
  getStripeStatus: (sessionId: string) =>
    api.get(`/stripe/status/${sessionId}`),
};

// Bank & Withdrawals API
export const bankApi = {
  getBankDetails: () => api.get('/users/bank-details'),
  updateBankDetails: (data: { iban: string; bic: string; account_holder: string }) =>
    api.put('/users/bank-details', data),
  requestWithdrawal: (amount: number) =>
    api.post('/cash-register/withdraw', { amount }),
  getWithdrawals: () => api.get('/withdrawals'),
};

// Subscriptions API
export const subscriptionsApi = {
  getStatus: () => api.get('/subscriptions/status'),
  createCheckout: (tier: string, originUrl: string) =>
    api.post('/subscriptions/checkout', { tier, origin_url: originUrl }),
  verify: (sessionId: string) => api.get(`/subscriptions/verify/${sessionId}`),
  cancel: () => api.post('/subscriptions/cancel'),
  reactivate: () => api.post('/subscriptions/reactivate'),
};

// Cash Register API
export const cashRegisterApi = {
  getCashRegister: () => api.get('/cash-register'),
};

// Messages API
export const messagesApi = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: string, skip?: number, limit?: number) =>
    api.get(`/messages/${conversationId}`, { params: { skip, limit } }),
  sendMessage: (data: { receiver_id: string; content: string; file_url?: string; file_name?: string }) =>
    api.post('/messages', data),
  openConversation: (receiverId: string) =>
    api.post('/conversations/open', { receiver_id: receiverId }),
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
  deleteConversation: (conversationId: string) =>
    api.delete(`/conversations/${conversationId}`),
};

// Favorites API
export const favoritesApi = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (freelancerId: string) => api.post(`/favorites/${freelancerId}`),
  removeFavorite: (freelancerId: string) => api.delete(`/favorites/${freelancerId}`),
};

// Categories API
export const categoriesApi = {
  getCategories: () => api.get('/categories'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Membership API
export const membershipApi = {
  getStatus: () => api.get('/membership/status'),
  join: () => api.post('/membership/confirm-payment', { session_id: `cs_mock_${Date.now()}` }),
  createCheckoutSession: (plan: string) => api.post('/membership/create-checkout-session', { plan }),
};

export const reviewsApi = {
  getReviews: (freelancerId: string) => api.get(`/reviews/${freelancerId}`),
  createReview: (data: { booking_id: string; rating: number; comment: string }) =>
    api.post('/reviews', data),
  createDirectReview: (data: { freelancer_id: string; rating: number; comment: string }) =>
    api.post('/reviews/direct', data),
};

// Subscription Plans API
export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
};

export default api;
