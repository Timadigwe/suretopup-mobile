import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, BASE_URL, apiService } from '@/services/api';
import { dashboardCacheUtils } from '@/utils/dashboardCache';
import { adminDashboardCacheUtils } from '@/utils/adminDashboardCache';


interface AuthContextType {
  user: AuthResponse['user'] | null;
  admin: {
    id: number;
    username: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string; data?: any; userData?: any }>;
  logout: () => Promise<void>;
  handleTokenExpiration: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyForgotPasswordOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, password: string, password_confirmation: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (verificationCode: string, bearerToken: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
  storeAuthDataAfterVerification: (authData: AuthResponse) => Promise<void>;
  clearAllStoredData: () => Promise<void>; // Development helper
  onLoginSuccess: () => void; // Callback for when login is successful
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [admin, setAdmin] = useState<{
    id: number;
    username: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for existing auth data on app startup
  React.useEffect(() => {
    const checkAuthData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedAdmin = await AsyncStorage.getItem('admin');
        const storedToken = await AsyncStorage.getItem('token');
        const storedIsAdmin = await AsyncStorage.getItem('isAdmin');
        
        if (storedToken) {
          if (storedIsAdmin === 'true' && storedAdmin) {
            // Admin authentication
            const adminData = JSON.parse(storedAdmin);
            setAdmin(adminData);
            setUser(null);
            setIsAdmin(true);
            setToken(storedToken);
            apiService.setToken(storedToken);
          } else if (storedUser) {
            // User authentication
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setAdmin(null);
            setIsAdmin(false);
            setToken(storedToken);
            apiService.setToken(storedToken);
          }
        }
        
        // Set up token expiration callback
        apiService.setTokenExpiredCallback(handleTokenExpiration);
      } catch (error) {
        // Error handling without console logs
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuthData();
  }, []);

  const storeAuthData = async (authData: AuthResponse) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('token', authData.token);
      setUser(authData.user);
      setToken(authData.token);
      setIsAdmin(false);
      // Set token in API service for future requests
      apiService.setToken(authData.token);
    } catch (error) {
      // Error handling without console logs
    }
  };

  const storeAdminAuthData = async (adminData: {
    token: string;
    token_type: string;
    admin: {
      id: number;
      username: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    expires_in: number;
  }) => {
    try {
      await AsyncStorage.setItem('admin', JSON.stringify(adminData.admin));
      await AsyncStorage.setItem('token', adminData.token);
      await AsyncStorage.setItem('isAdmin', 'true');
      setAdmin(adminData.admin);
      setToken(adminData.token);
      setIsAdmin(true);
      // Set token in API service for future requests
      apiService.setToken(adminData.token);
    } catch (error) {
      // Error handling without console logs
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('admin');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('isAdmin');
      // Clear wallet balance visibility state on logout
      await AsyncStorage.removeItem('wallet_show_balance');
      
      setUser(null);
      setAdmin(null);
      setToken(null);
      setIsAdmin(false);
      // Clear token from API service
      apiService.clearToken();
    } catch (error) {
      // Error handling without console logs
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        await storeAuthData(response.data);
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      // Error handling without console logs
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.adminLogin({ username, password });

      if (response.success && response.data) {
        await storeAdminAuthData(response.data);
        return { success: true, message: 'Admin login successful' };
      } else {
        return { success: false, message: response.message || 'Admin login failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(userData);

      if (response.success) {
        // Don't store any auth data - wait for user to login after email verification
        return { 
          success: true, 
          message: 'Registration successful. Please check your email for verification.',
          data: response.data // Return the data for email verification screen
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Registration failed',
          data: response // Include the full API response for validation errors
        };
      }
    } catch (error) {
      // Error handling without console logs
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (token) {
        // Use appropriate logout endpoint based on user type
        if (isAdmin) {
          await apiService.adminLogout();
        } else {
          const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();
        }
      }

      // Clear dashboard cache
      dashboardCacheUtils.reset();
      adminDashboardCacheUtils.reset();
      
      // Always clear local auth data regardless of server response
      await clearAuthData();
    } catch (error) {
      // Error handling without console logs
      // Clear dashboard cache even if server call fails
      dashboardCacheUtils.reset();
      adminDashboardCacheUtils.reset();
      // Still clear local auth data even if server call fails
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.forgotPassword(email);

      if (response.success) {
        return { success: true, message: response.message || 'OTP has been sent to your email.' };
      } else {
        return { success: false, message: response.message || 'Failed to send OTP' };
      }
    } catch (error) {
      // Error handling without console logs
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyForgotPasswordOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.status === 200 || data.success) {
        return { success: true, message: data.message || 'OTP verified successfully.' };
      } else {
        return { success: false, message: data.message || 'OTP verification failed' };
      }
    } catch (error) {
      // Error handling without console logs
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, otp: string, password: string, password_confirmation: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp, password, password_confirmation }),
      });

      const data = await response.json();

      if (data.status === 200 || data.success) {
        return { success: true, message: data.message || 'Password has been successfully reset.' };
      } else {
        return { success: false, message: data.message || 'Password reset failed' };
      }
    } catch (error) {
      // Error handling without console logs
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (verificationCode: string, bearerToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ verification_code: verificationCode }),
      });

      const data = await response.json();

      // Check for different success indicators
      if (data.success || response.status === 200) {
        return { success: true, message: data.message || 'Email verified successfully' };
      } else {
        return { success: false, message: data.message || `Server error: ${response.status}` };
      }
    } catch (error) {
      // Error handling without console logs
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      // Check if the response contains a success message (indicating success)
      if (data.message && data.message.toLowerCase().includes('successfully')) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to send verification code' };
      }
    } catch (error) {
      // Error handling without console logs
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuthDataAfterVerification = async (authData: AuthResponse) => {
    await storeAuthData(authData);
  };

  const clearAllStoredData = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      setToken(null);
      apiService.clearToken();
    } catch (error) {
      // Error handling without console logs
    }
  };

  const onLoginSuccess = () => {
    // This will be called when login is successful
    // Components can listen to this to reset their state
  };

  const handleTokenExpiration = async () => {
    console.log('handleTokenExpiration called - clearing auth data');
    // Clear dashboard cache as well
    dashboardCacheUtils.reset();
    // Clear auth data and redirect to login
    await clearAuthData();
  };

  const value: AuthContextType = {
    user,
    admin,
    token,
    isLoading,
    isInitialized,
    isAdmin,
    login,
    adminLogin,
    register,
    logout,
    handleTokenExpiration,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    verifyEmail,
    resendVerificationCode,
    storeAuthDataAfterVerification,
    clearAllStoredData,
    onLoginSuccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
