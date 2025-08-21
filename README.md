# SureTopUp Mobile App

A React Native mobile application built with Expo, implementing the SureTopUp fintech platform for mobile recharge, data purchase, and bill payments.

## Features

### 🎯 Core Features
- **Onboarding Flow**: Interactive introduction to the app with smooth animations
- **Authentication**: Login and signup with form validation
- **Dashboard**: Comprehensive overview with wallet balance, services, and transactions
- **Service Grid**: Quick access to airtime recharge, data purchase, electricity bills, betting, and more
- **Promotional Carousel**: Dynamic promotional offers and deals
- **Transaction History**: Recent transactions with status tracking
- **Haptic Feedback**: Enhanced user experience with tactile feedback

### 🎨 Design System
- **SureTopUp Brand Colors**: Green primary theme (#00A900) with consistent design language
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Modern UI**: Clean, card-based design with smooth animations
- **Responsive Layout**: Optimized for mobile devices with proper spacing and typography

### 📱 Mobile Optimizations
- **Expo Haptics**: Tactile feedback for user interactions
- **Linear Gradients**: Beautiful gradient backgrounds and cards
- **Vector Icons**: Consistent iconography using Ionicons
- **Safe Area Handling**: Proper handling of device notches and safe areas

## Project Structure

```
suretopup-mobile/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout with theme provider
│   └── (tabs)/                  # Tab navigation (placeholder)
├── components/                   # React components
│   ├── App.tsx                  # Main app component with navigation
│   ├── onboarding/              # Onboarding screens
│   ├── auth/                    # Authentication screens
│   ├── dashboard/               # Dashboard components
│   └── services/                # Service placeholder screens
├── contexts/                    # React contexts
│   └── ThemeContext.tsx         # Theme management
├── hooks/                       # Custom hooks
│   └── useMobileFeatures.ts     # Mobile-specific features
├── constants/                   # App constants
│   └── Colors.ts               # Color definitions
└── assets/                      # Static assets
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd suretopup-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Key Components

### OnboardingScreen
- Interactive slides with smooth transitions
- Progress indicators and navigation
- Skip functionality for quick access

### AuthScreen
- Login and signup forms
- Form validation with error handling
- Password visibility toggle
- Social login integration (placeholder)

### Dashboard
- Wallet balance card with hide/show functionality
- Service grid with 6 main services
- Promotional carousel with auto-slide
- Quick stats and recent transactions

### ServiceGrid
- 3x2 grid layout for services
- Color-coded service icons
- "Coming Soon" badges for future features

### PromoCarousel
- Auto-sliding promotional content
- Manual navigation controls
- Dot indicators for slide position

## Theme System

The app uses a comprehensive theme system with:

- **Primary Colors**: SureTopUp green (#00A900)
- **Accent Colors**: Yellow (#FFD700) for highlights
- **Semantic Colors**: Success, warning, destructive states
- **Dark Mode**: Automatic switching with proper contrast

## Mobile Features

### Haptic Feedback
- Light feedback for navigation
- Medium feedback for important actions
- Heavy feedback for errors
- Success feedback for completed actions

### Responsive Design
- Proper safe area handling
- Optimized for different screen sizes
- Touch-friendly button sizes
- Smooth animations and transitions

## Development

### Adding New Services
1. Add service to `ServiceGrid.tsx` services array
2. Create service screen component
3. Add navigation case in `App.tsx`

### Customizing Theme
1. Update colors in `constants/Colors.ts`
2. Modify theme context if needed
3. Update component styles to use theme colors

### Adding Animations
- Use React Native Reanimated for complex animations
- Implement haptic feedback for better UX
- Add loading states and transitions

## Future Enhancements

- [ ] Real API integration
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Offline support
- [ ] Deep linking
- [ ] Analytics integration
- [ ] A/B testing framework

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
