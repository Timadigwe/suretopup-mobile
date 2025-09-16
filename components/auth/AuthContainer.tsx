import React, { useState, useEffect } from 'react';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

type AuthScreen = 'signin' | 'signup' | 'forgot-password';

interface AuthContainerProps {
  onLogin: () => void;
  onBack: () => void;
  onEmailVerification: (email: string, registrationData?: any) => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  onLogin,
  onBack,
  onEmailVerification,
}) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('signin');

  // Reset to signin screen when AuthContainer mounts (e.g., after logout)
  useEffect(() => {
    console.log('AuthContainer mounted - resetting to signin screen');
    setCurrentScreen('signin');
  }, []);

  const handleSwitchToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleSwitchToSignIn = () => {
    setCurrentScreen('signin');
  };

  const handleForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleBackToAuth = () => {
    setCurrentScreen('signin');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'signin':
        return (
          <SignInScreen
            key="signin-screen"
            onLogin={onLogin}
            onBack={onBack}
            onSwitchToSignUp={handleSwitchToSignUp}
            onForgotPassword={handleForgotPassword}
          />
        );
      case 'signup':
        return (
          <SignUpScreen
            onBack={onBack}
            onSwitchToSignIn={handleSwitchToSignIn}
            onEmailVerification={onEmailVerification}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={handleBackToAuth}
            onComplete={handleBackToAuth}
          />
        );
      default:
        return (
          <SignInScreen
            key="signin-screen-default"
            onLogin={onLogin}
            onBack={onBack}
            onSwitchToSignUp={handleSwitchToSignUp}
            onForgotPassword={handleForgotPassword}
          />
        );
    }
  };

  return renderCurrentScreen();
};

export default AuthContainer;
