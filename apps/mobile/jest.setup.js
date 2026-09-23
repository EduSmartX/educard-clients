jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { API_URL: 'http://localhost:8000/api', APP_ENV: 'test' },
}));

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve()),
  resetGenericPassword: jest.fn(() => Promise.resolve()),
}));

// lucide-react-native ships many ESM (.mjs) icon files; render any icon as a View in tests.
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, prop) => (prop === '__esModule' ? true : View),
    }
  );
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});

jest.mock('react-native-document-picker', () => ({
  __esModule: true,
  default: { pickSingle: jest.fn(), pick: jest.fn() },
  types: { xlsx: 'xlsx', xls: 'xls' },
  isCancel: jest.fn(() => false),
}));

jest.mock('react-native-image-picker', () => ({
  __esModule: true,
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View };
});

// Avoid loading real reanimated/worklets (needs native init) in tests.
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const chainable = () =>
    new Proxy(function noop() {}, {
      get: () => chainable(),
      apply: () => chainable(),
    });
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    Image: RN.Image,
    createAnimatedComponent: (component) => component,
  };
  return new Proxy(
    { __esModule: true, default: Animated },
    {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        if (prop === 'View') return RN.View;
        if (prop === 'Text') return RN.Text;
        if (prop === 'ScrollView') return RN.ScrollView;
        if (prop === 'Image') return RN.Image;
        return chainable();
      },
    }
  );
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    Directions: {},
    gestureHandlerRootHOC: (component) => component,
  };
});
