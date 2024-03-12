import './App.css';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import MapComponent from './Map/MyMap';


function App() {
  const render = (status: Status) => (<h1>{status}</h1>);

  return (
    <div className="App">
      <Wrapper apiKey={process.env.REACT_APP_GOOGLE_API_KEY!} render={render}>
        <MapComponent />
      </Wrapper>
    </div>
  );
}

export default App;
