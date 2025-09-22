import React, { createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RememberMeContextType {
  // State
  rememberMe: boolean;
  savedCredentials: {
    email: string;
    username: string;
    password: string;
  } | null;
  
  // Actions
  setRememberMe: (value: boolean) => void;
  saveCredentials: (email: string, username: string, password: string) => Promise<void>;
  loadCredentials: () => Promise<{
    email: string;
    username: string;
    password: string;
  } | null>;
  clearCredentials: () => Promise<void>;
  toggleRememberMe: () => void;
}

const RememberMeContext = createContext<RememberMeContextType | undefined>(undefined);

export const useRememberMe = () => {
  const context = useContext(RememberMeContext);
  if (!context) {
    throw new Error('useRememberMe must be used within a RememberMeProvider');
  }
  return context;
};

interface RememberMeProviderProps {
  children: ReactNode;
}

export const RememberMeProvider: React.FC<RememberMeProviderProps> = ({ children }) => {
  const [rememberMe, setRememberMeState] = React.useState(false);
  const [savedCredentials, setSavedCredentials] = React.useState<{
    email: string;
    username: string;
    password: string;
  } | null>(null);

  const setRememberMe = (value: boolean) => {
    setRememberMeState(value);
  };

  const saveCredentials = async (email: string, username: string, password: string) => {
    if (__DEV__) {
      console.log('RememberMeContext: Saving credentials', {
        email: email || 'empty',
        username: username || 'empty',
        password: password ? '***' : 'empty'
      });
    }
    try {
      await Promise.all([
        AsyncStorage.setItem('remember_me_email', email),
        AsyncStorage.setItem('remember_me_username', username),
        AsyncStorage.setItem('remember_me_password', password),
        AsyncStorage.setItem('remember_me_status', 'true')
      ]);
      
      setSavedCredentials({ email, username, password });
      setRememberMeState(true);
      
      if (__DEV__) {
        console.log('RememberMeContext: Credentials saved successfully');
        // Verify the save by reading back from AsyncStorage
        const [savedEmail, savedUsername, savedPassword, savedStatus] = await Promise.all([
          AsyncStorage.getItem('remember_me_email'),
          AsyncStorage.getItem('remember_me_username'),
          AsyncStorage.getItem('remember_me_password'),
          AsyncStorage.getItem('remember_me_status')
        ]);
        console.log('RememberMeContext: Verification after save:', {
          email: savedEmail || 'null',
          username: savedUsername || 'null',
          password: savedPassword ? '***' : 'null',
          status: savedStatus || 'null'
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.log('RememberMeContext: Error saving credentials:', error);
      }
    }
  };

  const loadCredentials = async () => {
    if (__DEV__) {
      console.log('RememberMeContext: Loading credentials from AsyncStorage');
    }
    try {
      const [savedEmail, savedUsername, savedPassword, rememberMeStatus] = await Promise.all([
        AsyncStorage.getItem('remember_me_email'),
        AsyncStorage.getItem('remember_me_username'),
        AsyncStorage.getItem('remember_me_password'),
        AsyncStorage.getItem('remember_me_status')
      ]);
      
      if (__DEV__) {
        console.log('RememberMeContext: AsyncStorage content:', {
          email: savedEmail || 'null',
          username: savedUsername || 'null',
          password: savedPassword ? '***' : 'null',
          status: rememberMeStatus || 'null'
        });
      }
      
      if ((savedEmail || savedUsername) && savedPassword && rememberMeStatus === 'true') {
        const credentials = {
          email: savedEmail || '',
          username: savedUsername || '',
          password: savedPassword,
        };
        
        setSavedCredentials(credentials);
        setRememberMeState(true);
        
        if (__DEV__) {
          console.log('RememberMeContext: Credentials loaded successfully');
        }
        return credentials;
      }
      
      if (__DEV__) {
        console.log('RememberMeContext: No valid credentials found');
      }
      return null;
    } catch (error) {
      if (__DEV__) {
        console.log('RememberMeContext: Error loading credentials:', error);
      }
      return null;
    }
  };

  const clearCredentials = async () => {
    if (__DEV__) {
      console.log('RememberMeContext: Clearing credentials');
    }
    try {
      await Promise.all([
        AsyncStorage.removeItem('remember_me_email'),
        AsyncStorage.removeItem('remember_me_username'),
        AsyncStorage.removeItem('remember_me_password'),
        AsyncStorage.removeItem('remember_me_status')
      ]);
      
      setSavedCredentials(null);
      setRememberMeState(false);
      
      if (__DEV__) {
        console.log('RememberMeContext: Credentials cleared successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('RememberMeContext: Error clearing credentials:', error);
      }
    }
  };

  const toggleRememberMe = () => {
    if (__DEV__) {
      console.log('RememberMeContext: Toggling remember me from', rememberMe, 'to', !rememberMe);
    }
    setRememberMeState(!rememberMe);
  };

  const value: RememberMeContextType = {
    rememberMe,
    savedCredentials,
    setRememberMe,
    saveCredentials,
    loadCredentials,
    clearCredentials,
    toggleRememberMe,
  };

  return (
    <RememberMeContext.Provider value={value}>
      {children}
    </RememberMeContext.Provider>
  );
};

export default RememberMeContext;
