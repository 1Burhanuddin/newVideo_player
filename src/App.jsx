import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import YouTubePlayer from './YouTubePlayer';
import VideoList from './VideoList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<VideoList />} />
          <Route path="/video/:videoId" element={<YouTubePlayer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
