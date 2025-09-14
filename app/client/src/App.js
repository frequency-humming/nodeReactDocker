import Home from './Home';
import NotFound from './NotFound';
import Navbar from './Navbar';
import Notification from './Notification';
import Analytics from './Analytics';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar/>
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/analytics" element={<Analytics />} />
            <Route exact path="/notifications" element={<Notification />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>   
      </div>
    </Router>
  );
}

export default App;