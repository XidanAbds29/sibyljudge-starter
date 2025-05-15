import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Tracks from './pages/Tracks';
import Login from './pages/Login';
import ProblemList from './components/ProblemList';
import ProblemPage from './components/ProblemPage';

function App() {
  return (
    <div className="text-white font-mono">
      <nav className="fixed top-0 left-0 w-full p-4 bg-black/70 backdrop-blur-md flex space-x-6 z-10">
        <Link to="/" className="hover:text-sibyl">Home</Link>
        <Link to="/tracks" className="hover:text-sibyl">Tracks</Link>
        <Link to="/login" className="hover:text-sibyl">Login</Link>
        <Link to="/problems" className="hover:text-sibyl">Problems</Link>
      </nav>

      <div className="pt-20 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problem/:external_id" element={<ProblemPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
