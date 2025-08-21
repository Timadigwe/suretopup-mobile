import React, { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { AuthScreen } from './auth/AuthScreen';
import { EmailVerificationScreen } from './auth/EmailVerificationScreen';
import { ForgotPasswordScreen } from './auth/ForgotPasswordScreen';
import { HomeScreen } from './dashboard/HomeScreen';
import { TransactionsScreen } from './dashboard/TransactionsScreen';
import { WalletScreen } from './dashboard/WalletScreen';
import { ProfileScreen } from './dashboard/ProfileScreen';
import { ServicePlaceholder } from './services/ServicePlaceholder';
import { useAuth } from '@/contexts/AuthContext';

type AppScreen = 
  | 'onboarding' 
  | 'auth' 
  | 'email-verification'
  | 'forgot-password'
  | 'dashboard' 
  | 'home'
  | 'transactions'
  | 'wallet'
  | 'profile'
  | 'airtime' 
  | 'data' 
  | 'electricity' 
  | 'betting' 
  | 'bills' 
  | 'printing' 
  | 'add-funds' 
  | 'notifications';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [userEmail, setUserEmail] = useState('');
  const [registrationData, setRegistrationData] = useState<any>(null);
  const { user, token, isInitialized } = useAuth();
  
  // Determine if user is authenticated based on context
  const isAuthenticated = !!(user && token);

  // Set initial screen based on authentication state
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('onboarding');
      }
    }
  }, [isAuthenticated, isInitialized]);

  const handleOnboardingComplete = () => {
    setCurrentScreen('auth');
  };

  const handleLogin = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentScreen('auth');
  };

  const handleNavigate = (page: string) => {
    setCurrentScreen(page as AppScreen);
  };

  const handleBackToOnboarding = () => {
    setCurrentScreen('onboarding');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleEmailVerification = (email: string, regData?: any) => {
    setUserEmail(email);
    setRegistrationData(regData);
    setCurrentScreen('email-verification');
  };

  const handleVerificationComplete = () => {
    // Store auth data after successful verification
    if (registrationData) {
      // The auth context will handle storing the data
      setCurrentScreen('dashboard');
    }
  };

  const handleBackToAuth = () => {
    setCurrentScreen('auth');
  };

  const handleForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleForgotPasswordComplete = () => {
    setCurrentScreen('auth');
  };

  // Render different screens based on current state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
        
      case 'auth':
        return (
          <AuthScreen 
            onLogin={handleLogin}
            onBack={handleBackToOnboarding}
            onEmailVerification={handleEmailVerification}
            onForgotPassword={handleForgotPassword}
          />
        );
        
      case 'email-verification':
        return (
          <EmailVerificationScreen
            onVerificationComplete={handleVerificationComplete}
            onBack={handleBackToAuth}
            userEmail={userEmail}
            registrationData={registrationData}
          />
        );
        
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={handleBackToAuth}
            onComplete={handleForgotPasswordComplete}
          />
        );
        
      case 'dashboard':
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'transactions':
        return <TransactionsScreen onNavigate={handleNavigate} />;
        
      case 'wallet':
        return <WalletScreen onNavigate={handleNavigate} />;
        
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'airtime':
      case 'data':
      case 'electricity':
      case 'betting':
      case 'bills':
      case 'printing':
        return (
          <ServicePlaceholder 
            serviceName={currentScreen}
            onBack={handleBackToDashboard}
          />
        );
        
      case 'add-funds':
      case 'transactions':
      case 'profile':
      case 'notifications':
        return (
          <ServicePlaceholder 
            serviceName={currentScreen.replace('-', ' ')}
            onBack={handleBackToDashboard}
          />
        );
        
      default:
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
    }
  };

  return renderScreen();
};
