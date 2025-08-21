import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse } from '@/services/api';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string; data?: any; userData?: any }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyForgotPasswordOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, password: string, password_confirmation: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (verificationCode: string, bearerToken: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
  storeAuthDataAfterVerification: (authData: AuthResponse) => Promise<void>;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing auth data on app startup
  React.useEffect(() => {
    const checkAuthData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error checking auth data:', error);
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
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Login request:', { email, password: '***' });
      
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success) {
        console.log('Login successful, user data:', data.data);
        console.log('Login token:', data.data?.token);
        console.log('Token length:', data.data?.token?.length);
        await storeAuthData(data.data);
        return { success: true, message: 'Login successful' };
      } else {
        console.log('Login failed:', data.message);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (data.success) {
        console.log('Registration successful, user data:', data.data);
        console.log('Registration token:', data.data?.token);
        console.log('Token length:', data.data?.token?.length);
        // Don't store auth data yet - wait for email verification
        return { 
          success: true, 
          message: 'Registration successful',
          data: data.data // Return the data for email verification screen
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Registration failed',
          data: data // Include the full API response for validation errors
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Logout request - token available:', !!token);
      console.log('Logout token:', token);
      
      if (token) {
        const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Logout response status:', response.status);
        const data = await response.json();
        console.log('Logout response data:', data);

        if (response.ok) {
          console.log('Logout successful on server');
        } else {
          console.log('Logout failed on server:', data.message);
        }
      }

      // Always clear local auth data regardless of server response
      await clearAuthData();
      console.log('Local auth data cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local auth data even if server call fails
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      console.log('Forgot password request:', { email });
      
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Forgot password response status:', response.status);
      const data = await response.json();
      console.log('Forgot password response data:', data);

      if (data.status === 200 || data.success) {
        return { success: true, message: data.message || 'OTP has been sent to your email.' };
      } else {
        return { success: false, message: data.message || 'Failed to send OTP' };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyForgotPasswordOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      console.log('Verify OTP request:', { email, otp });
      
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/forgot-password-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      console.log('Verify OTP response status:', response.status);
      const data = await response.json();
      console.log('Verify OTP response data:', data);

      if (data.status === 200 || data.success) {
        return { success: true, message: data.message || 'OTP verified successfully.' };
      } else {
        return { success: false, message: data.message || 'OTP verification failed' };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, otp: string, password: string, password_confirmation: string) => {
    setIsLoading(true);
    try {
      console.log('Reset password request:', { email, otp, password: '***', password_confirmation: '***' });
      
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/forgot-password-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp, password, password_confirmation }),
      });

      console.log('Reset password response status:', response.status);
      const data = await response.json();
      console.log('Reset password response data:', data);

      if (data.status === 200 || data.success) {
        return { success: true, message: data.message || 'Password has been successfully reset.' };
      } else {
        return { success: false, message: data.message || 'Password reset failed' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (verificationCode: string, bearerToken: string) => {
    setIsLoading(true);
    try {
      console.log('Verification request:', {
        code: verificationCode,
        token: bearerToken.substring(0, 20) + '...', // Log partial token for debugging
      });
      console.log('Full bearer token for verification:', bearerToken);
      console.log('Bearer token length:', bearerToken.length);

      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ verification_code: verificationCode }),
      });

      console.log('Verification response status:', response.status);
      const data = await response.json();
      console.log('Verification response data:', data);

      // Check for different success indicators
      if (data.success || response.status === 200) {
        return { success: true, message: data.message || 'Email verified successfully' };
      } else {
        return { success: false, message: data.message || `Server error: ${response.status}` };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, message: `Network error: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://prod.suretopup.com.ng/api/v1/auth/resend-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      console.log('Resend API response:', data); // Debug log

      // Check if the response contains a success message (indicating success)
      if (data.message && data.message.toLowerCase().includes('successfully')) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to send verification code' };
      }
    } catch (error) {
      console.error('Resend verification code error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuthDataAfterVerification = async (authData: AuthResponse) => {
    await storeAuthData(authData);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    verifyEmail,
    resendVerificationCode,
    storeAuthDataAfterVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
