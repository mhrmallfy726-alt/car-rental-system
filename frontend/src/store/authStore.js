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
      
          console.log(res.data);
      
          // إذا كان السيرفر أعاد success:false
          if (!res.data.success) {
            set({
              error: res.data.message,
              isLoading: false,
            });
      
            return {
              success: false,
              message: res.data.message,
              verification_status: res.data.verification_status,
              reason: res.data.reason,
              commercial_register_reason: res.data.commercial_register_reason,
              owner_id_reason: res.data.owner_id_reason,
              avatar_reason: res.data.avatar_reason,
              phone: res.data.phone,
              email: res.data.email,
            };
          }
      
          const { token, user } = res.data;
      
          localStorage.setItem("token", token);
      
          set({
            user,
            token,
            isLoading: false,
          });
      
          return {
            success: true,
            user,
            token,
          };
      
        } catch (err) {
          const data = err.response?.data || {};
      
          set({
            error: data.message || "فشل تسجيل الدخول",
            isLoading: false,
          });
      
          return {
            success: false,
            message: data.message || "فشل تسجيل الدخول",
            verification_status: data.verification_status,
            reason: data.reason,
            commercial_register_reason: data.commercial_register_reason,
            owner_id_reason: data.owner_id_reason,
            avatar_reason: data.avatar_reason,
            phone: data.phone,
            email: data.email,
          };
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
        if (!get().token) return;
      
        set({ isLoading: true });
      
        try {
          const res = await authAPI.getMe();
      
          set({
            user: res.data.user,
            isLoading: false,
          });
      
        } catch (err) {
      
          get().logout();
      
          set({
            isLoading: false,
          });
      
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
