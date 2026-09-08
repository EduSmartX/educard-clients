/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundPushHandlers } from './src/lib/push/background-handler';

// Must run before the app mounts so a killed app can still be woken by FCM.
registerBackgroundPushHandlers();

AppRegistry.registerComponent(appName, () => App);
