import React, { createContext, useContext, useState } from 'react';
import { setAccessToken, clearAccessToken } from '../API/axios';
// import api from '../API/axios';

// ملاحظة: هذا مخزن بسيط. أفضل حل: استخدام HttpOnly cookie للـ refresh token و endpoint للتحقق من الجلسة.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const isAuthenticated = !!user;

  const loginWithToken = (token, userInfo) => {
    setAccessToken(token);
    setUser(userInfo);
  };

  const logout = async () => {
    try {
      // إذا كان هناك endpoint للـ logout (مسح cookie) يمكنك مناداته:
      // await api.post('/auth/logout');
    } catch (e) {}
    clearAccessToken();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginWithToken, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
  
};

export const useAuth = () => useContext(AuthContext);