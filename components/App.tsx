import React, { useState, useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
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
import { DepositReceiptScreen } from './dashboard/receipts/DepositReceiptScreen';
import { AirtimeReceiptScreen } from './dashboard/receipts/AirtimeReceiptScreen';
import { DataReceiptScreen } from './dashboard/receipts/DataReceiptScreen';
import { CardPrintingReceiptScreen } from './dashboard/receipts/CardPrintingReceiptScreen';
import { BettingReceiptScreen } from './dashboard/receipts/BettingReceiptScreen';
import { ElectricityReceiptScreen } from './dashboard/receipts/ElectricityReceiptScreen';
import { CableReceiptScreen } from './dashboard/receipts/CableReceiptScreen';
import { NinReceiptScreen } from './dashboard/receipts/NinReceiptScreen';
import { CacReceiptScreen } from './dashboard/receipts/CacReceiptScreen';
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
  const [navigationHistory, setNavigationHistory] = useState<AppScreen[]>(['onboarding']);
  const { user, token, isInitialized, logout } = useAuth();
  
  // Determine if user is authenticated based on context
  const isAuthenticated = !!(user && token);
  
  // Initialize wasAuthenticated based on current auth state
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  
  // Track authentication state changes to set wasAuthenticated
  useEffect(() => {
    if (isAuthenticated) {
      setWasAuthenticated(true);
    }
  }, [isAuthenticated]);
  
  // Set initial screen based on authentication state
  useEffect(() => {
    if (isInitialized && !isInAuthFlow) {
      if (isAuthenticated) {
        setCurrentScreen('dashboard');
        setNavigationHistory(['dashboard']);
      } else {
        // If user was previously authenticated, redirect to login (token expired)
        // Otherwise, redirect to onboarding (first time user)
        if (wasAuthenticated) {
          setCurrentScreen('auth');
          setIsInAuthFlow(true);
          setNavigationHistory(['auth']);
        } else {
          setCurrentScreen('onboarding');
          setNavigationHistory(['onboarding']);
        }
      }
    }
  }, [isAuthenticated, isInitialized, isInAuthFlow, wasAuthenticated]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // Define screens that should exit the app
      const exitScreens: AppScreen[] = ['onboarding', 'dashboard', 'home'];
      
      // If we're on an exit screen or have no history, show exit confirmation
      if (exitScreens.includes(currentScreen) || navigationHistory.length <= 1) {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the app?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default behavior
      }
      
      // Navigate back to previous screen
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current screen
      const previousScreen = newHistory[newHistory.length - 1];
      
      if (previousScreen) {
        setCurrentScreen(previousScreen);
        setNavigationHistory(newHistory);
        
        // Clear receipt data if going back from receipt
        if (currentScreen === 'receipt') {
          setReceiptData(null);
          setReceiptSource('home');
        }
      }
      
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen, navigationHistory]);

  // Remove the problematic useEffect that was causing unwanted redirects
  // The authentication flow will be handled manually through the handlers

  const handleOnboardingComplete = () => {
    setIsInAuthFlow(true);
    setCurrentScreen('auth');
    setNavigationHistory(['onboarding', 'auth']);
  };

  const handleLogin = () => {
    setIsInAuthFlow(false);
    setCurrentScreen('dashboard');
    setNavigationHistory(['auth', 'dashboard']);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setWasAuthenticated(false);
      setIsInAuthFlow(true);
      setCurrentScreen('auth');
      setNavigationHistory(['auth']);
    } catch (error) {
      setWasAuthenticated(false);
      setIsInAuthFlow(true);
      setCurrentScreen('auth');
      setNavigationHistory(['auth']);
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
    
    // Update navigation history
    setNavigationHistory(prev => [...prev, page as AppScreen]);
    setCurrentScreen(page as AppScreen);
  };

  // Determine which receipt component to show based on transaction type
  const getReceiptComponent = (data: any) => {
    const service = data?.service?.toLowerCase() || '';
    
    // Check for deposit transactions
    if (service.includes('deposit') || service.includes('fund') || service.includes('credit') || 
        data?.type?.toLowerCase() === 'credit') {
      return (
        <DepositReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for airtime transactions
    if (service.includes('airtime') || service.includes('recharge')) {
      return (
        <AirtimeReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for data transactions
    if (service.includes('data') || service.includes('internet')) {
      return (
        <DataReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for card printing transactions
    if (service.includes('card') || service.includes('pin') || service.includes('recharge')) {
      return (
        <CardPrintingReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for betting transactions
    if (service.includes('bet') || service.includes('fund') || service.includes('betting')) {
      return (
        <BettingReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for electricity transactions
    if (service.includes('electricity') || service.includes('power') || service.includes('bill')) {
      return (
        <ElectricityReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for cable transactions
    if (service.includes('cable') || service.includes('tv') || service.includes('dstv') || service.includes('gotv') || service.includes('startimes')) {
      return (
        <CableReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for NIN transactions
    if (service.includes('nin') || service.includes('slip') || service.includes('print')) {
      return (
        <NinReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Check for CAC transactions
    if (service.includes('cac') || service.includes('registration') || service.includes('business')) {
      return (
        <CacReceiptScreen
          receiptData={data}
          onClose={() => handleNavigate(receiptSource)}
        />
      );
    }
    
    // Default to general transaction receipt for now
    // All specific receipt components have been created
    return (
      <TransactionReceiptScreen
        receiptData={data}
        onClose={() => handleNavigate(receiptSource)}
      />
    );
  };

  const handleBackToOnboarding = () => {
    setCurrentScreen('onboarding');
    setNavigationHistory(['onboarding']);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setNavigationHistory(['dashboard']);
  };

  const handleEmailVerification = (email: string, regData?: any) => {
    setUserEmail(email);
    setRegistrationData(regData);
    setCurrentScreen('email-verification');
    setNavigationHistory(prev => [...prev, 'email-verification']);
  };

  const handleVerificationComplete = () => {
    // After successful email verification, go back to auth screen for login
    // Clear registration data since we don't need it anymore
    setRegistrationData(null);
    setCurrentScreen('auth');
    setNavigationHistory(['auth']);
  };

  const handleBackToAuth = () => {
    setCurrentScreen('auth');
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      // Remove email-verification from history if it exists
      const filteredHistory = newHistory.filter(screen => screen !== 'email-verification');
      return [...filteredHistory, 'auth'];
    });
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
          getReceiptComponent(receiptData)
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
