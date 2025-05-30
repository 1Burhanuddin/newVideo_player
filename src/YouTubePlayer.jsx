import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import disableDevtool from 'disable-devtool';
import { useParams } from 'react-router-dom'; // Import useParams

const YouTubePlayer = () => {
  const { videoId } = useParams(); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDevToolsMessage, setShowDevToolsMessage] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); 
  const [showExitButton, setShowExitButton] = useState(false); 
  const [showControls, setShowControls] = useState(true); 
  const [currentTime, setCurrentTime] = useState(0); 
  const [isLiveStream, setIsLiveStream] = useState(false); 
  const [duration, setDuration] = useState(0); 
  const [showOverlay, setShowOverlay] = useState(false); 
  const [showEndScreen, setShowEndScreen] = useState(false); 
  const [volume, setVolume] = useState(100); 
  const [isMuted, setIsMuted] = useState(false); 
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const hideButtonTimerRef = useRef(null); 

  useEffect(() => {
    
    disableDevtool({
      ondevtoolopen: () => {
        setShowDevToolsMessage(true);
        
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

  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      
      setShowControls(true);
      if (isFullScreen) {
        setShowExitButton(true); 
      }
      
      if (hideButtonTimerRef.current) {
        clearTimeout(hideButtonTimerRef.current);
        console.log('Cleared previous hide timer.');
      }
     
      hideButtonTimerRef.current = setTimeout(() => {
        console.log('Timer finished. Hiding controls.');
        setShowControls(false);
        if (isFullScreen) {
           setShowExitButton(false); 
        }
      }, 3000);
    };

    
    console.log('Adding mousemove listener.');
    container.addEventListener('mousemove', handleMouseMove);

    
    if (isLiveStream) {
      setShowControls(true);
      setShowExitButton(false); 
    }

    if (isFullScreen) {
      
      container.classList.add('fullscreen-active');
    } else {
      setShowExitButton(false); 
      
      container.classList.remove('fullscreen-active');
    }

    return () => {
      
      if (container) {
        console.log('Cleaning up mousemove listener.');
        container.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (hideButtonTimerRef.current) {
        console.log('Cleaning up hide timer.');
        clearTimeout(hideButtonTimerRef.current);
      }
    };
  }, [isFullScreen, isLiveStream]); 

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    
    const iframe = event.target.getIframe();
    if (iframe) {
      iframe.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      
      iframe.addEventListener('fullscreenchange', handleFullscreenChange);
      iframe.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      iframe.addEventListener('mozfullscreenchange', handleFullscreenChange);
      iframe.addEventListener('msFullscreenChange', handleFullscreenChange);
    }
    
    const videoDuration = playerRef.current.getDuration();
    setDuration(videoDuration);
    
    if (videoDuration === 0) {
      setIsLiveStream(true);
    }
    
    if (playerRef.current) {
      setVolume(playerRef.current.getVolume());
      setIsMuted(playerRef.current.isMuted());
    }
  };

  const handleFullscreenChange = () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    const isCurrentlyFullScreen = !!fullscreenElement;
    console.log('Fullscreen change detected. isCurrentlyFullScreen:', isCurrentlyFullScreen);
    setIsFullScreen(isCurrentlyFullScreen);
    console.log('Updated isFullScreen state:', isCurrentlyFullScreen);

    if (isCurrentlyFullScreen) {
      document.body.classList.add('fullscreen-active');
      document.documentElement.classList.add('fullscreen-active'); 
    } else {
      document.body.classList.remove('fullscreen-active');
      document.documentElement.classList.remove('fullscreen-active'); 
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
      setShowEndScreen(false); 
      setShowOverlay(true); 
      if (!isLiveStream) {
        setShowControls(false);
      }
    } else if (event.data === YouTube.PlayerState.PAUSED) {
      setIsPlaying(false);
      setShowControls(true);
      setShowOverlay(false); 
    } else if (event.data === YouTube.PlayerState.ENDED) {
      setIsPlaying(false);
      setShowEndScreen(true); 
      setShowControls(false); 
      setShowOverlay(false); 
    }
  };

  
  useEffect(() => {
    let intervalId;
    if (isPlaying && playerRef.current) {
      intervalId = setInterval(() => {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration()); 
      }, 100); 
    } else {
      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying]); 

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
      playerRef.current.seekTo(0, true); 
      playerRef.current.playVideo(); 
      setShowEndScreen(false); 
    }
  };

  const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      
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

  // Handle volume change
  const handleVolumeChange = (event) => {
    const newVolume = parseInt(event.target.value, 10);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  // mute toggle
  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        
        if (volume === 0) {
           setVolume(50); 
           playerRef.current.setVolume(50);
        }
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

 
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
                
                autoplay: 1,
                controls: 0, // Dissable default controls
                modestbranding: 1, // Hide Youube logo
                rel: 0, // do not show related videos
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
              {/* Volume Control */}
              <div className="volume-control">
                <button onClick={toggleMute}>
                  {isMuted || volume === 0 ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  disabled={isLiveStream} // Disable slider for live streams
                />
              </div>
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
                 zIndex: 10001, // above the video
                 backgroundColor: 'rgba(0, 0, 0, 0.5)', 
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
