import React, { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { AuthContainer } from './auth/AuthContainer';
import { EmailVerificationScreen } from './auth/EmailVerificationScreen';
import { HomeScreen } from './dashboard/HomeScreen';
import { TransactionsScreen } from './dashboard/TransactionsScreen';
import { WalletScreen } from './dashboard/WalletScreen';
import { ProfileScreen } from './dashboard/ProfileScreen';
import { AddFundsScreen } from './dashboard/AddFundsScreen';
import { AirtimeRechargeScreen } from './dashboard/AirtimeRechargeScreen';
import { DataPurchaseScreen } from './dashboard/DataPurchaseScreen';
import { CardPrintingScreen } from './dashboard/CardPrintingScreen';
import { BettingFundingScreen } from './dashboard/BettingFundingScreen';
import ElectricityScreen from './dashboard/ElectricityScreen';
import { TestReceiptScreen } from './dashboard/TestReceiptScreen';
import { TransactionReceiptScreen } from './dashboard/TransactionReceiptScreen';
import OtherServicesScreen from './dashboard/OtherServicesScreen';
import CableScreen from './dashboard/CableScreen';
import NinScreen from './dashboard/NinScreen';
import CacScreen from './dashboard/CacScreen';
import { ServicePlaceholder } from './services/ServicePlaceholder';
import { NotificationsScreen } from './dashboard/NotificationsScreen';
import { HelpSupportScreen } from './dashboard/HelpSupportScreen';
import { AboutScreen } from './dashboard/AboutScreen';
import { useAuth } from '@/contexts/AuthContext';

type AppScreen = 
  | 'onboarding' 
  | 'auth' 
  | 'email-verification'
  | 'dashboard' 
  | 'home'
  | 'transactions'
  | 'wallet'
  | 'profile'
  | 'airtime' 
  | 'data' 
  | 'electricity' 
  | 'betting' 
  | 'betting-funding'
  | 'printing' 
  | 'add-funds' 
  | 'notifications'
  | 'help-support'
  | 'about'
  | 'test-receipt'
  | 'receipt'
  | 'other-services'
  | 'service-placeholder'
  | 'cable'
  | 'nin'
  | 'cac';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [userEmail, setUserEmail] = useState('');
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptSource, setReceiptSource] = useState<string>('home');
  const [isInAuthFlow, setIsInAuthFlow] = useState(false);
  const { user, token, isInitialized, logout } = useAuth();
  
  // Determine if user is authenticated based on context
  const isAuthenticated = !!(user && token);

  // Set initial screen based on authentication state
  useEffect(() => {
    if (isInitialized && !isInAuthFlow) {
      if (isAuthenticated) {
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('onboarding');
      }
    }
  }, [isAuthenticated, isInitialized, isInAuthFlow]);

  // Remove the problematic useEffect that was causing unwanted redirects
  // The authentication flow will be handled manually through the handlers

  const handleOnboardingComplete = () => {
    setIsInAuthFlow(true);
    setCurrentScreen('auth');
  };

  const handleLogin = () => {
    setIsInAuthFlow(false);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsInAuthFlow(true);
      setCurrentScreen('auth');
    } catch (error) {
      setIsInAuthFlow(true);
      setCurrentScreen('auth');
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    if (page === 'receipt' && data) {
      setReceiptData(data);
      // Track where the receipt was opened from
      setReceiptSource(currentScreen);
    }
    if (page === 'service-placeholder' && data) {
      setReceiptData(data);
    }
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
    // After successful email verification, go back to auth screen for login
    // Clear registration data since we don't need it anymore
    setRegistrationData(null);
    setCurrentScreen('auth');
  };

  const handleBackToAuth = () => {
    setCurrentScreen('auth');
  };





  // Render different screens based on current state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
        
      case 'auth':
        return (
          <AuthContainer 
            onLogin={handleLogin}
            onBack={handleBackToOnboarding}
            onEmailVerification={handleEmailVerification}
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
        
      case 'dashboard':
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'transactions':
        return <TransactionsScreen onNavigate={handleNavigate} />;
        
      case 'wallet':
        return <WalletScreen onNavigate={handleNavigate} />;
        
      case 'add-funds':
        return <AddFundsScreen onNavigate={handleNavigate} />;
        
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        
      case 'airtime':
        return <AirtimeRechargeScreen onNavigate={handleNavigate} />;
        
      case 'data':
        return <DataPurchaseScreen onNavigate={handleNavigate} />;
        
      case 'electricity':
        return <ElectricityScreen onNavigate={handleNavigate} />;
        
      case 'other-services':
        return <OtherServicesScreen onNavigate={handleNavigate} />;
        
      case 'cable':
        return <CableScreen onNavigate={handleNavigate} />;
        
              case 'nin':
          return <NinScreen onNavigate={handleNavigate} />;
        case 'cac':
          return <CacScreen onNavigate={handleNavigate} />;
        
      case 'betting':
        return (
          <ServicePlaceholder 
            serviceName={currentScreen}
            onBack={handleBackToDashboard}
          />
        );
        
      case 'printing':
        return <CardPrintingScreen onNavigate={handleNavigate} />;
        
      case 'betting-funding':
        return <BettingFundingScreen onNavigate={handleNavigate} />;
        
      case 'test-receipt':
        return <TestReceiptScreen onNavigate={handleNavigate} />;
        
      case 'receipt':
        return receiptData ? (
          <TransactionReceiptScreen
            receiptData={receiptData}
            onClose={() => handleNavigate(receiptSource)}
          />
        ) : (
          <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />
        );
        
      case 'service-placeholder':
        return (
          <ServicePlaceholder 
            serviceName={receiptData?.serviceName || 'Service'}
            onBack={handleBackToDashboard}
          />
        );
        
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} />;
        
      case 'help-support':
        return <HelpSupportScreen onNavigate={handleNavigate} />;
        
      case 'about':
        return <AboutScreen onNavigate={handleNavigate} />;
        
      default:
        return <HomeScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
    }
  };

  return renderScreen();
};
