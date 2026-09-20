import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import { branchAuthAPI } from '../services/branchAuthAPI';

const normalizeFailure = (data = {}) => ({
  success: false,
  message: data.message || 'فشل تسجيل الدخول',
  error: data.error,
  verification_status: data.verification_status,
  requiresVerification: data.requiresVerification,
  verificationToken: data.verificationToken,
  account_type: data.account_type,
  reason: data.reason,
  commercial_register_reason: data.commercial_register_reason,
  owner_id_reason: data.owner_id_reason,
  avatar_reason: data.avatar_reason,
  phone: data.phone,
  email: data.email,
});

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        // حسابات المعارض تستخدم مسارًا مستقلًا.
        try {
          const branchResponse = await branchAuthAPI.login(credentials);
          const branchData = branchResponse.data || {};

          if (branchData.requiresVerification) {
            set({ isLoading: false });
            return normalizeFailure(branchData);
          }

          if (branchData.success && branchData.token && branchData.user) {
            localStorage.setItem('token', branchData.token);
            set({ user: branchData.user, token: branchData.token, isLoading: false });
            return { success: true, user: branchData.user, token: branchData.token };
          }
        } catch (branchError) {
          // إذا لم يكن الحساب تابعًا لمعرض، نتابع تسجيل الدخول العادي.
          if (branchError.response?.status !== 401 && branchError.response?.status !== 404) {
            const data = branchError.response?.data || {};
            if (data.requiresVerification) {
              set({ isLoading: false });
              return normalizeFailure(data);
            }
          }
        }

        try {
          const res = await authAPI.login(credentials);
          const data = res.data || {};

          if (!data.success) {
            const result = normalizeFailure(data);
            set({ error: result.message, isLoading: false });
            return result;
          }

          const { token, user } = data;
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
          return { success: true, user, token };
        } catch (err) {
          const result = normalizeFailure(err.response?.data || {});
          set({ error: result.message, isLoading: false });
          return result;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authAPI.register(data);
          const { token, user, message } = res.data;
          if (token && user) {
            localStorage.setItem('token', token);
            set({ user, token, isLoading: false });
          } else {
            set({ isLoading: false });
          }
          return { success: true, user, message };
        } catch (err) {
          const msg = err.response?.data?.message || 'فشل إنشاء الحساب';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      sendBranchOTP: async (data) => {
        const response = await branchAuthAPI.sendOTP(data);
        return response.data;
      },

      verifyBranchOTP: async (data) => {
        const response = await branchAuthAPI.verifyOTP(data);
        const result = response.data || {};
        if (result.token && result.user) {
          localStorage.setItem('token', result.token);
          set({ user: result.user, token: result.token });
        }
        return result;
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
      },

      fetchMe: async () => {
        if (!get().token) return;
        set({ isLoading: true });
        try {
          const res = await authAPI.getMe();
          set({ user: res.data.user, isLoading: false });
        } catch (err) {
          get().logout();
          set({ isLoading: false });
        }
      },

      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      isSupplier: () => get().user?.role === 'supplier',
      isCustomer: () => get().user?.role === 'customer',
      isE: () => get().user?.role === 'employee',
    }),
    {
      name: 'car-rental-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
