import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { authApi, AuthApiService, type User } from '../services/authApi';
import { registerSessionExpiredHandler } from '../../../utils/common/interceptor';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  async login(): Promise<boolean> {
    return false;
  },
  logout(): void {
    /* default implementation */
  },
});

function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const initializeAuth = (): void => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // An expired token must not count as a session: without this check
          // the user looked logged in until the first API call failed.
          const expiry = AuthApiService.getTokenExpiry(storedToken);
          if (expiry !== null && expiry * 1000 <= Date.now()) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setLoading(false);
            return;
          }

          const tokenUserData = AuthApiService.decodeToken(storedToken);

          if (tokenUserData) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const logout = useCallback((): void => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }, []);

  // A 401 anywhere in the app must clear the React session too, not just
  // localStorage (otherwise protected routes stayed reachable).
  useEffect(() => {
    registerSessionExpiredHandler(logout);
    return () => registerSessionExpiredHandler(undefined);
  }, [logout]);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    // Clear any existing auth state before login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);

    const response = await authApi.login({ username, password });

    if (response.token) {
      localStorage.setItem('authToken', response.token);

      const userData = AuthApiService.decodeToken(response.token);

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth, AuthProvider };
