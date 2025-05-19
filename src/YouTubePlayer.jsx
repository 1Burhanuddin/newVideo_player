import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import disableDevtool from 'disable-devtool';
import { useParams } from 'react-router-dom'; // Import useParams

const YouTubePlayer = () => {
  const { videoId } = useParams(); // Get videoId from route parameters
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDevToolsMessage, setShowDevToolsMessage] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Add state for full screen
  const [showExitButton, setShowExitButton] = useState(false); // Add state for exit button visibility
  const [showControls, setShowControls] = useState(true); // Add state for control visibility
  const [currentTime, setCurrentTime] = useState(0); // Add state for current time
  const [isLiveStream, setIsLiveStream] = useState(false); // Add state for live stream
  const [duration, setDuration] = useState(0); // Add state for duration
  const [showOverlay, setShowOverlay] = useState(false); // Add state for click-blocking overlay
  const [showEndScreen, setShowEndScreen] = useState(false); // Add state for end screen
  const playerRef = useRef(null);
  const containerRef = useRef(null); // Add a ref for the container
  const hideButtonTimerRef = useRef(null); // Add a ref for the timer

  useEffect(() => {
    // Attempt to disable dev tools
    disableDevtool({
      ondevtoolopen: () => {
        setShowDevToolsMessage(true);
        // Optionally, pause the video or take other actions
        if (playerRef.current) {
          playerRef.current.internalPlayer.pauseVideo();
          setIsPlaying(false);
        }
      },
      interval: 500,
      disableMenu: true // Disable right-click menu via the library
    });

    // Additional right-click prevention
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    const playerContainer = document.querySelector('.youtube-player-container');
    if (playerContainer) {
      playerContainer.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (playerContainer) {
        playerContainer.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, []);

  // Effect for handling mouse movement, control visibility, and exit button visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      // Show controls on mouse move
      setShowControls(true);
      if (isFullScreen) {
        setShowExitButton(true); // Also show exit button in fullscreen
      }
      // Clear previous timer
      if (hideButtonTimerRef.current) {
        clearTimeout(hideButtonTimerRef.current);
        console.log('Cleared previous hide timer.');
      }
      // Set a new timer to hide controls after 3 seconds of inactivity
      hideButtonTimerRef.current = setTimeout(() => {
        console.log('Timer finished. Hiding controls.');
        setShowControls(false);
        if (isFullScreen) {
           setShowExitButton(false); // Also hide exit button in fullscreen
        }
      }, 3000);
    };

    // Add mousemove listener
    console.log('Adding mousemove listener.');
    container.addEventListener('mousemove', handleMouseMove);

    // For live streams, ensure controls are initially visible but the timer will hide them
    if (isLiveStream) {
      setShowControls(true);
      setShowExitButton(false); // Hide exit button for live streams
    }

    if (isFullScreen) {
      // Add the fullscreen-active class
      container.classList.add('fullscreen-active');
    } else {
      setShowExitButton(false); // Hide button when not in fullscreen
      // Remove the fullscreen-active class
      container.classList.remove('fullscreen-active');
    }

    return () => {
      // Clean up listeners on component unmount or isFullScreen/isLiveStream change
      if (container) {
        console.log('Cleaning up mousemove listener.');
        container.removeEventListener('mousemove', handleMouseMove);
      }
      // Clear timer on cleanup
      if (hideButtonTimerRef.current) {
        console.log('Cleaning up hide timer.');
        clearTimeout(hideButtonTimerRef.current);
      }
    };
  }, [isFullScreen, isLiveStream]); // Re-run effect when isFullScreen or isLiveStream changes

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    // Block right-click on the YouTube iframe itself
    const iframe = event.target.getIframe();
    if (iframe) {
      iframe.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      // Add fullscreen change listeners
      iframe.addEventListener('fullscreenchange', handleFullscreenChange);
      iframe.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      iframe.addEventListener('mozfullscreenchange', handleFullscreenChange);
      iframe.addEventListener('msfullscreenchange', handleFullscreenChange);
    }
    // Set initial duration when player is ready
    const videoDuration = playerRef.current.getDuration();
    setDuration(videoDuration);
    // Check if it's a live stream (duration is 0)
    if (videoDuration === 0) {
      setIsLiveStream(true);
    }
  };

  const handleFullscreenChange = () => {
    // Check if the document is currently in fullscreen mode
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    const isCurrentlyFullScreen = !!fullscreenElement;
    console.log('Fullscreen change detected. isCurrentlyFullScreen:', isCurrentlyFullScreen);
    setIsFullScreen(isCurrentlyFullScreen);
    console.log('Updated isFullScreen state:', isCurrentlyFullScreen);

    // Add/remove fullscreen-active class to body
    if (isCurrentlyFullScreen) {
      document.body.classList.add('fullscreen-active');
      document.documentElement.classList.add('fullscreen-active'); // Also add to html
    } else {
      document.body.classList.remove('fullscreen-active');
      document.documentElement.classList.remove('fullscreen-active'); // Also remove from html
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      setShowEndScreen(false); // Hide end screen when playing
      setShowOverlay(true); // Always show overlay when playing
      // Hide controls when playing, unless it's a live stream
      if (!isLiveStream) {
        setShowControls(false);
      }
    } else if (event.data === YouTube.PlayerState.PAUSED) {
      setIsPlaying(false);
      // Show controls when paused
      setShowControls(true);
      setShowOverlay(false); // Hide overlay when paused
    } else if (event.data === YouTube.PlayerState.ENDED) {
      setIsPlaying(false);
      setShowEndScreen(true); // Show end screen when ended
      setShowControls(false); // Hide controls on end screen
      setShowOverlay(false); // Hide click overlay on end screen
    }
  };

  // Effect to update current time and duration
  useEffect(() => {
    let intervalId;
    if (isPlaying && playerRef.current) {
      intervalId = setInterval(() => {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration()); // Update duration in case it changes
      }, 100); // Update every 100ms
    } else {
      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying]); // Re-run effect when isPlaying changes

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const rewindVideo = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime - 10, true);
    }
  };

  const handleReplay = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, true); // Seek to the beginning
      playerRef.current.playVideo(); // Play the video
      setShowEndScreen(false); // Hide the end screen
    }
  };

  const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) { /* Firefox */
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) { /* IE/Edge */
        container.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    }
  };

  // Function to handle seeking when clicking on the progress bar
  const handleSeek = (event) => {
    if (isLiveStream || !playerRef.current) return; // Disable seeking for live streams

    const progressBar = event.currentTarget;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const percentage = clickPosition / progressBar.offsetWidth;
    const seekTime = duration * percentage;
    playerRef.current.seekTo(seekTime, true);
  };

  // Format time in HH:MM:SS or MM:SS format
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
      const paddedHours = String(hours).padStart(2, '0');
      return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
      return `${paddedMinutes}:${paddedSeconds}`;
    }
  };

  // Render the player and controls
  return (
    <div className={`youtube-player-container ${isFullScreen ? 'fullscreen-active' : ''}`} ref={containerRef}>
      {showDevToolsMessage ? (
        <div className="devtools-message-container">
          <h2>Developer Tools Detected!</h2>
          <p>Please close your browser's developer tools to continue.</p>
        </div>
      ) : (
        <>
          <YouTube
            videoId={videoId}
            opts={{
              height: '390',
              width: '640',
              playerVars: {
                // https://developers.google.com/youtube/player_parameters
                autoplay: 1,
                controls: 0, // Disable default controls
                modestbranding: 1, // Hide YouTube logo
                rel: 0, // Do not show related videos
              },
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="youtube-iframe"
          />
          {/* Click-blocking overlay */}
          <div
            className="click-overlay"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          ></div>

          {/* End Screen Overlay - Needs CSS for styling */} 
          {showEndScreen && (
            <div className="end-screen-overlay">
              <div className="end-screen-content">
                <h2>Video Ended</h2>
                <button onClick={handleReplay}>Replay</button>
              </div>
            </div>
          )}

          {showControls && (
            <div className={`custom-controls ${isLiveStream ? 'live-stream-controls' : ''}`}>
              {!isLiveStream && (
                <button onClick={togglePlayPause}>
                  {isPlaying ? '❚❚' : '▶'}
                </button>
              )}
              {/* Rewind button - only show for non-live streams */}
              {!isLiveStream && (
                <button onClick={rewindVideo}>
                  <img src="https://img.icons8.com/ios-filled/50/replay-10.png" alt="Rewind 10 seconds" style={{ width: '24px', height: '24px', filter: 'invert(1)' }} /> {/* Placeholder for 10-second rewind icon */}
                </button>
              )}
              {/* Progress bar - only show for non-live streams */}
              {!isLiveStream && (
                <div className="progress-bar-container" onClick={handleSeek}>
                  <div
                    className="progress-bar-filled"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              )}
              {/* Time display - only show for non-live streams */}
              {!isLiveStream && (
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              )}
              {/* Fullscreen button */}
              <button onClick={toggleFullScreen}>
                {'⤢'}
              </button>
            </div>
          )}
          {/* Exit Fullscreen Button - only show in fullscreen and when controls are visible */}
          {isFullScreen && showExitButton && (
             <button
               onClick={toggleFullScreen}
               style={{
                 position: 'absolute',
                 top: '10px',
                 right: '10px',
                 zIndex: 10001, // Ensure it's above the video
                 backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
                 color: 'white',
                 border: 'none',
                 borderRadius: '5px',
                 padding: '5px 10px',
                 cursor: 'pointer',
               }}
             >
               Exit Fullscreen
             </button>
           )}
        </>
      )}
    </div>
  );
};

export default YouTubePlayer;