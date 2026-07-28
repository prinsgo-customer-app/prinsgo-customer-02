import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const token = await AsyncStorage.getItem('prinsgo_token');
      if (token) {
        const res = await getMe();
        setUser(res.data.user);
      }
    } catch (err) {
      await AsyncStorage.removeItem('prinsgo_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (token, userData) => {
    await AsyncStorage.setItem('prinsgo_token', token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('prinsgo_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await getMe();
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
