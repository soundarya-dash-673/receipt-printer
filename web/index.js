import {AppRegistry} from 'react-native';
import App from '../App';
import app from '../app.json';

AppRegistry.registerComponent(app.name, () => App);
AppRegistry.runApplication(app.name, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
