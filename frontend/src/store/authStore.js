import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authAPI.login(credentials);
          const { token, user } = res.data;
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || 'فشل تسجيل الدخول';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      // Register
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authAPI.register(data);
          const { token, user } = res.data;
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || 'فشل إنشاء الحساب';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
      },

      // Refresh user
      fetchMe: async () => {
        try {
          const res = await authAPI.getMe();
          set({ user: res.data.user });
        } catch (_) {
          get().logout();
        }
      },

      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      isSupplier: () => get().user?.role === 'supplier',
      isCustomer: () => get().user?.role === 'customer',
    }),
    {
      name: 'car-rental-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
