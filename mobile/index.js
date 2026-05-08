/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundNotificationHandler } from './src/notifications/handlers';

registerBackgroundNotificationHandler();

AppRegistry.registerComponent(appName, () => App);
