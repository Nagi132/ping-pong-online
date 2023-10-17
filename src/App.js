import './App.css';
import TitleScreen from './TitleScreen';
import Canvas from "./Canvas";

import { 
  BrowserRouter as Router, 
  Switch, 
  Route, 
  Redirect,
  Link, 
} from "react-router-dom"; 

function App() {

  //routing to other pages
  <Route path="/" element={<App/>}>
  <Route path="Canvas.js" element={<OpenCanvas/>} />
  <Route path="TitleScreen.js" element={<TitleScreen/>}/>
  </Route>;

function OpenCanvas() {
  // Since Contact is not a parent of EditContact we need to go up one level
  // in the path, instead of one level in the Route hierarchy
  return (
    <Link to="Canvas.js" relative="path">
      Cancel
    </Link>
  );
}

  return (
     <> 
      


      

      <div className="App">
      <TitleScreen/>
      <Canvas width="800" height ="500"></Canvas>
      
    </div>
    </> 
   
  );
}

export default App;
