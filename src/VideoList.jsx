import React, { useState, useEffect } from 'react';
import disableDevtool from 'disable-devtool';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

const videos = [
  { id: 'dqFY2ijqM-4', title: 'Video 1 Title', thumbnailUrl: 'https://img.youtube.com/vi/dqFY2ijqM-4/hqdefault.jpg' },
  { id: 'VjfeI_8Y-Z1_MjuD', title: 'Video 2 Title', thumbnailUrl: 'https://img.youtube.com/vi/XHzoK6BJK8Q/hqdefault.jpg' },
  { id: 'cRugC_qCet0', title: 'New Video Title', thumbnailUrl: 'https://img.youtube.com/vi/cRugC_qCet0/hqdefault.jpg' },
  // Add more video objects here
];

const VideoList = () => {
  const [showDevToolsMessage, setShowDevToolsMessage] = useState(false);

  useEffect(() => {
    // Attempt to disable dev tools
    disableDevtool({
      ondevtoolopen: () => {
        setShowDevToolsMessage(true);
      },
      interval: 500,
      disableMenu: true // Disable right-click menu via the library
    });

    // Additional right-click prevention
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (showDevToolsMessage) {
    return (
      <div className="devtools-message-container">
        <h2>Developer Tools Detected</h2>
        <p>Please close developer tools to continue browsing videos.</p>
      </div>
    );
  }

  return (
    <div className="video-list-container">
      <h1>Available Videos</h1>
      <div className="video-grid">
        {videos.map((video) => (
          <Link to={`/video/${video.id}`} key={video.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="video-item">
              <img src={video.thumbnailUrl} alt={video.title} />
              <div>
                <h3>{video.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VideoList;
