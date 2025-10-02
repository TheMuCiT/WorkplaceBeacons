import { StatusBar } from 'react-native';
import BeaconScreen from './app/BeaconScreen';

function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <BeaconScreen />
    </>
  );
}

export default App;
