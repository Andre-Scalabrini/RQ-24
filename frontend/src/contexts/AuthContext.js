import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredData = async () => {
      const storedToken = localStorage.getItem('@RQ24:token');
      const storedUser = localStorage.getItem('@RQ24:user');

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('@RQ24:token');
          localStorage.removeItem('@RQ24:user');
        }
      }
      setLoading(false);
    };

    loadStoredData();
  }, []);

  const login = async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    const { usuario, token } = response.data;

    localStorage.setItem('@RQ24:token', token);
    localStorage.setItem('@RQ24:user', JSON.stringify(usuario));

    api.defaults.headers.Authorization = `Bearer ${token}`;
    setUser(usuario);

    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('@RQ24:token');
    localStorage.removeItem('@RQ24:user');
    api.defaults.headers.Authorization = '';
    setUser(null);
  };

  const isAdmin = () => user?.grupo === 'administrador';
  const canMoveFicha = () => user?.grupo === 'administrador' || user?.grupo === 'superior';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, canMoveFicha }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
