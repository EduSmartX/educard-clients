# EduCard Mobile App - Developer Testing Guide

## Overview

This document provides comprehensive testing procedures for developers working on the EduCard mobile application. Follow these guidelines to ensure quality before submitting PRs.

---

## 1. Development Environment Setup

### Prerequisites

```bash
# Node.js 18+ (LTS recommended)
node --version  # v18.x or higher

# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Watchman (macOS)
brew install watchman

# iOS Development (macOS only)
xcode-select --install
# Install Xcode from App Store

# Android Development
# Install Android Studio
# Configure ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Project Setup

```bash
# Clone repository
git clone git@github.com:EduSmartX/educard-mobile.git
cd educard-mobile

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development

# Start development server
npx expo start
```

---

## 2. Running the App

### Development Mode

```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Press 'w' for Web browser

# With specific options
npx expo start --clear          # Clear cache
npx expo start --ios            # Open iOS directly
npx expo start --android        # Open Android directly
npx expo start --web            # Open Web directly
npx expo start --tunnel         # For physical device over network
```

### Development Build (Recommended for full testing)

```bash
# Install development build on iOS Simulator
npx expo run:ios

# Install development build on Android Emulator
npx expo run:android

# Build development client
eas build --profile development --platform ios
eas build --profile development --platform android
```

---

## 3. Unit Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- --testPathPattern="auth"

# Run with coverage
npm test -- --coverage

# Update snapshots
npm test -- --updateSnapshot
```

### Writing Unit Tests

```typescript
// __tests__/utils/date.test.ts
import { formatDate, parseDate, isToday } from '@/utils/date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-04-14');
      expect(formatDate(date)).toBe('14 Apr 2026');
    });

    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });
});
```

### Testing Hooks

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
  });
});
```

### Testing Components

```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button title="Click me" onPress={() => {}} />);
    
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    render(<Button title="Click me" onPress={mockOnPress} />);
    
    fireEvent.press(screen.getByText('Click me'));
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    const mockOnPress = jest.fn();
    render(<Button title="Loading" onPress={mockOnPress} loading />);
    
    fireEvent.press(screen.getByText('Loading'));
    
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should show loading indicator when loading', () => {
    render(<Button title="Loading" onPress={() => {}} loading />);
    
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

---

## 4. Integration Testing

### API Integration Tests

```typescript
// __tests__/api/students.test.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fetchStudents, createStudent } from '@/api/students';

const server = setupServer(
  rest.get('*/api/students/', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          { id: '1', name: 'John Doe', rollNumber: 'A001' },
          { id: '2', name: 'Jane Doe', rollNumber: 'A002' },
        ],
      })
    );
  }),
  rest.post('*/api/students/', (req, res, ctx) => {
    return res(
      ctx.json({
        data: { id: '3', ...req.body },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Students API', () => {
  it('should fetch students list', async () => {
    const result = await fetchStudents();
    
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('John Doe');
  });

  it('should create new student', async () => {
    const newStudent = {
      name: 'New Student',
      rollNumber: 'A003',
      classId: 'class-1',
    };
    
    const result = await createStudent(newStudent);
    
    expect(result.data.name).toBe('New Student');
  });

  it('should handle API errors', async () => {
    server.use(
      rest.get('*/api/students/', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    await expect(fetchStudents()).rejects.toThrow();
  });
});
```

### Navigation Tests

```typescript
// __tests__/navigation/auth-flow.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from '@/navigation/AuthNavigator';

describe('Auth Navigation Flow', () => {
  it('should navigate from login to forgot password', async () => {
    const { getByText, findByText } = render(
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
    
    fireEvent.press(getByText('Forgot Password?'));
    
    await waitFor(() => {
      expect(findByText('Reset Password')).toBeTruthy();
    });
  });
});
```

---

## 5. E2E Testing with Detox

### Setup Detox

```bash
# Install Detox CLI
npm install -g detox-cli

# Install project dependencies
npm install --save-dev detox @types/detox

# Build the test app
detox build --configuration ios.sim.debug
detox build --configuration android.emu.debug
```

### Writing E2E Tests

```typescript
// e2e/auth/login.test.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@email.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Invalid credentials')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('admin@educard.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

// e2e/attendance/mark-attendance.test.ts
describe('Mark Attendance Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login as teacher
    await element(by.id('email-input')).typeText('teacher@educard.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('dashboard-screen'))).toBeVisible();
  });

  it('should navigate to attendance screen', async () => {
    await element(by.id('attendance-tab')).tap();
    await expect(element(by.id('attendance-screen'))).toBeVisible();
  });

  it('should select class and date', async () => {
    await element(by.id('class-picker')).tap();
    await element(by.text('Class 5A')).tap();
    
    await element(by.id('date-picker')).tap();
    await element(by.text('14')).tap();  // Select 14th
    await element(by.text('Confirm')).tap();
    
    await waitFor(element(by.id('student-list')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should mark student as present', async () => {
    await element(by.id('student-row-1')).tap();
    await element(by.id('present-button')).tap();
    
    await expect(element(by.id('student-row-1-status')))
      .toHaveText('Present');
  });

  it('should submit attendance', async () => {
    await element(by.id('submit-attendance')).tap();
    
    await waitFor(element(by.text('Attendance saved successfully')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### Running E2E Tests

```bash
# Build and run iOS tests
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Build and run Android tests
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# Run specific test file
detox test --configuration ios.sim.debug e2e/auth/login.test.ts

# Run with verbose output
detox test --configuration ios.sim.debug --loglevel verbose
```

---

## 6. Manual Testing Checklist

### 6.1 Authentication Tests

| Test Case | iOS | Android | Web |
|-----------|-----|---------|-----|
| Login with valid credentials | ☐ | ☐ | ☐ |
| Login with invalid email | ☐ | ☐ | ☐ |
| Login with wrong password | ☐ | ☐ | ☐ |
| Forgot password flow | ☐ | ☐ | ☐ |
| Logout clears all data | ☐ | ☐ | ☐ |
| Session persists after app restart | ☐ | ☐ | ☐ |
| Token refresh works | ☐ | ☐ | ☐ |
| Biometric login (if enabled) | ☐ | ☐ | N/A |

### 6.2 Role-Based Navigation Tests

#### Admin Role
| Test Case | iOS | Android | Web |
|-----------|-----|---------|-----|
| Dashboard loads correctly | ☐ | ☐ | ☐ |
| Can view teachers list | ☐ | ☐ | ☐ |
| Can add new teacher | ☐ | ☐ | ☐ |
| Can view students list | ☐ | ☐ | ☐ |
| Can view classes | ☐ | ☐ | ☐ |
| Settings screen accessible | ☐ | ☐ | ☐ |

#### Employee Role
| Test Case | iOS | Android | Web |
|-----------|-----|---------|-----|
| Dashboard shows assigned classes | ☐ | ☐ | ☐ |
| Can mark attendance | ☐ | ☐ | ☐ |
| Can view timetable | ☐ | ☐ | ☐ |
| Can enter exam marks | ☐ | ☐ | ☐ |
| Profile editable | ☐ | ☐ | ☐ |

#### Parent Role
| Test Case | iOS | Android | Web |
|-----------|-----|---------|-----|
| Dashboard shows children | ☐ | ☐ | ☐ |
| Can view child attendance | ☐ | ☐ | ☐ |
| Can view exam results | ☐ | ☐ | ☐ |
| Notifications visible | ☐ | ☐ | ☐ |

### 6.3 Offline Mode Tests

| Test Case | iOS | Android | Web |
|-----------|-----|---------|-----|
| Offline banner appears when disconnected | ☐ | ☐ | ☐ |
| Cached data displayed offline | ☐ | ☐ | ☐ |
| Offline actions queued | ☐ | ☐ | ☐ |
| Queued actions sync when online | ☐ | ☐ | ☐ |
| No crashes when offline | ☐ | ☐ | ☐ |

### 6.4 Push Notification Tests

| Test Case | iOS | Android |
|-----------|-----|---------|
| Permission prompt appears | ☐ | ☐ |
| Token registered on backend | ☐ | ☐ |
| Notification received (app foreground) | ☐ | ☐ |
| Notification received (app background) | ☐ | ☐ |
| Notification received (app killed) | ☐ | ☐ |
| Tap notification opens correct screen | ☐ | ☐ |

### 6.5 Responsive UI Tests

| Test Case | iOS Phone | iOS Tablet | Android Phone | Android Tablet | Web |
|-----------|-----------|------------|---------------|----------------|-----|
| Portrait mode | ☐ | ☐ | ☐ | ☐ | ☐ |
| Landscape mode | ☐ | ☐ | ☐ | ☐ | ☐ |
| Safe areas respected | ☐ | ☐ | ☐ | ☐ | N/A |
| Tab bar usable | ☐ | ☐ | ☐ | ☐ | ☐ |
| Forms scrollable | ☐ | ☐ | ☐ | ☐ | ☐ |
| Keyboard doesn't overlap | ☐ | ☐ | ☐ | ☐ | ☐ |

### 6.6 Performance Tests

| Test Case | Target | Actual |
|-----------|--------|--------|
| App launch time | < 3s | ___s |
| Screen transition | < 300ms | ___ms |
| List scroll (60fps) | Yes | ☐ |
| Memory usage (idle) | < 150MB | ___MB |
| Memory usage (active) | < 300MB | ___MB |
| API response caching works | Yes | ☐ |

---

## 7. Device Testing Matrix

### Recommended Test Devices

#### iOS
| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| iPhone 15 Pro | iOS 17+ | 6.1" | High |
| iPhone SE (3rd) | iOS 17+ | 4.7" | High |
| iPhone 14 | iOS 16+ | 6.1" | Medium |
| iPad Pro 11" | iPadOS 17+ | 11" | Medium |
| iPad Mini | iPadOS 16+ | 8.3" | Low |

#### Android
| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| Pixel 8 | Android 14 | 6.2" | High |
| Samsung S23 | Android 13+ | 6.1" | High |
| Pixel 6a | Android 13+ | 6.1" | Medium |
| Samsung Tab S9 | Android 13+ | 11" | Medium |
| Low-end device | Android 10+ | Various | Low |

---

## 8. Debugging Tips

### React Native Debugger

```bash
# Install React Native Debugger
brew install react-native-debugger

# Open debugger before starting app
open "rndebugger://set-debugger-loc?host=localhost&port=8081"

# Start Expo with remote debugging
npx expo start
# Press 'j' to open debugger
```

### Flipper (Alternative)

```bash
# Install Flipper
brew install flipper

# Add Flipper to your project (only for dev builds)
npx expo install react-native-flipper
```

### Logging

```typescript
// Use proper logging (not console.log)
import { logger } from '@/lib/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', { error });

// In development, logs go to console
// In production, logs go to error tracking service
```

### Network Debugging

```typescript
// Enable network inspector
if (__DEV__) {
  // React Query devtools
  import('@tanstack/react-query-devtools');
}

// Log all API requests
api.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
  }
  return config;
});
```

---

## 9. Pre-PR Checklist

### Code Quality
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Prettier applied (`npm run format`)
- [ ] No console.log statements
- [ ] No commented code
- [ ] No TODOs without issue link

### Tests
- [ ] Unit tests pass (`npm test`)
- [ ] Test coverage maintained (>80%)
- [ ] New features have tests
- [ ] E2E tests pass (if applicable)

### Manual Verification
- [ ] Tested on iOS Simulator
- [ ] Tested on Android Emulator
- [ ] Tested on physical device
- [ ] Tested in both orientations
- [ ] Tested offline mode
- [ ] No regressions in existing features

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] README updated if needed
- [ ] Breaking changes documented

---

## 10. Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive --no-wait
```

---

## Quick Commands Reference

```bash
# Development
npx expo start                    # Start dev server
npx expo start --clear            # Clear cache and start

# Testing
npm test                          # Run unit tests
npm test -- --watch               # Watch mode
npm test -- --coverage            # With coverage
detox test                        # Run E2E tests

# Linting & Formatting
npm run lint                      # Check linting
npm run lint:fix                  # Fix lint errors
npm run format                    # Format code
npm run typecheck                 # Check TypeScript

# Building
eas build --profile development   # Dev build
eas build --profile preview       # Preview build
eas build --profile production    # Production build

# Debugging
npx expo doctor                   # Check project health
npx expo install --fix            # Fix dependency issues
```
