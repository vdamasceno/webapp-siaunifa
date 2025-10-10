'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Precisamos de uma biblioteca para ler o token

// Tipos para organizar nosso código
interface User {
  id: number;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Quando a aplicação carrega, verifica se já existe um token no navegador
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token inválido, limpando...", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        setIsAuthenticated(true);
    } catch (error) {
        console.error("Erro ao decodificar token no login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    // Redireciona para a página de login para uma experiência de logout completa
    window.location.href = '/login';
  };

  // =================================================================
  // ★★★ ESTA É A VERSÃO FINAL E CORRETA DA authFetch ★★★
  // =================================================================
  const authFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const backendUrl = 'http://localhost:3001';
    const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;

    console.log(`Enviando requisição para: ${fullUrl}`);

    // A função agora simplesmente prepara tudo e retorna a chamada fetch.
    // Ela não tenta mais adivinhar como ler a resposta.
    return fetch(fullUrl, { ...options, headers });
  };
  // =================================================================

  const contextValue = {
    isAuthenticated,
    user,
    login,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};