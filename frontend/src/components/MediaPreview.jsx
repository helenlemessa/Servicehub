import { useState, useRef, useEffect } from 'react';
import { FaDownload, FaTimes, FaFile, FaPlay, FaPause } from 'react-icons/fa';

const MediaPreview = ({ message, isSender }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const isImageFile = (url, filename, messageType) => {
    if (messageType === 'image') return true;
    const ext = getFileExtension(filename);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    if (imageExtensions.includes(ext)) return true;
    if (url && url.includes('/image/upload/')) return true;
    return false;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  const downloadFile = async (url, filename) => {
    try {
      const fullUrl = getFullUrl(url);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(getFullUrl(url), '_blank');
    }
  };

  const openInNewTab = (url) => {
    window.open(getFullUrl(url), '_blank');
  };

  // Handle image messages
  if (isImageFile(message.mediaUrl, message.mediaName, message.messageType)) {
    return (
      <>
        <div 
          className="relative cursor-pointer group"
          onClick={() => setShowFullImage(true)}
        >
          <img
            src={message.mediaUrl}
            alt={message.mediaName || 'Image'}
            className="max-w-[250px] max-h-[250px] rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm">Click to expand</span>
          </div>
        </div>
        
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={message.mediaUrl}
                alt={message.mediaName}
                className="max-w-full max-h-[90vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadFile(message.mediaUrl, message.mediaName); }}
                  className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
                >
                  <FaDownload />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openInNewTab(message.mediaUrl); }}
                  className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
                >
                  <FaFile />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }}
                  className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Handle voice messages with seek functionality
  if (message.messageType === 'voice') {
    const audioUrl = getFullUrl(message.mediaUrl);

    // Set up audio event listeners
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
        if (!isDragging) {
          setCurrentTime(audio.currentTime);
        }
      };

      const handleLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
        setIsLoading(false);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      const handleWaiting = () => {
        setIsLoading(true);
      };

      const handlePlaying = () => {
        setIsLoading(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setIsLoading(false);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      };

      const handlePlay = () => {
        setIsPlaying(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('playing', handlePlaying);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    }, [audioUrl, isDragging]);

    // Stop other audio instances when this one plays
    useEffect(() => {
      if (isPlaying && audioRef.current) {
        const allAudios = document.querySelectorAll('audio');
        allAudios.forEach(audio => {
          if (audio !== audioRef.current && !audio.paused) {
            audio.pause();
          }
        });
      }
    }, [isPlaying]);

    const togglePlay = () => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        audioRef.current.play()
          .catch((err) => {
            console.error('Play failed:', err);
            setIsLoading(false);
          });
      }
    };

    // Handle click on progress bar to seek
    const handleSeek = (e) => {
      if (!progressBarRef.current || duration <= 0 || !audioRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, x / width));
      const newTime = percentage * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };

    // Handle drag start
    const handleDragStart = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    // Handle drag move
    useEffect(() => {
      const handleDragMove = (e) => {
        if (!isDragging || !progressBarRef.current || duration <= 0 || !audioRef.current) return;
        
        const rect = progressBarRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        
        setCurrentTime(newTime);
        audioRef.current.currentTime = newTime;
      };

      const handleDragEnd = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        return () => {
          window.removeEventListener('mousemove', handleDragMove);
          window.removeEventListener('mouseup', handleDragEnd);
        };
      }
    }, [isDragging, duration]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className={`flex flex-col gap-2 p-3 rounded-lg ${isSender ? 'bg-blue-600' : 'bg-gray-100'} w-full max-w-[280px]`}>
        {/* Play button and time row */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition disabled:opacity-50 bg-black bg-opacity-20"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <FaPause size={14} className={isSender ? 'text-white' : 'text-gray-700'} />
            ) : (
              <FaPlay size={14} className={isSender ? 'text-white' : 'text-gray-700'} />
            )}
          </button>
          
          <div className={`text-xs font-mono ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {/* Progress Bar with draggable thumb */}
        <div className="relative">
          {/* Track background */}
          <div 
            ref={progressBarRef}
            className="w-full h-2 bg-gray-400 bg-opacity-30 rounded-full cursor-pointer"
            onClick={handleSeek}
          />
          
          {/* Progress fill */}
          <div 
            className="absolute left-0 top-0 h-2 bg-blue-500 rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          
          {/* Draggable thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
            style={{ left: `calc(${progress}% - 8px)` }}
            onMouseDown={handleDragStart}
          />
        </div>
        
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  // Handle files
  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'xls' || ext === 'xlsx') return '📊';
    if (ext === 'txt') return '📃';
    if (ext === 'zip' || ext === 'rar') return '🗜️';
    if (ext === 'mp3' || ext === 'wav') return '🎵';
    if (ext === 'mp4' || ext === 'mov') return '🎬';
    return '📎';
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg ${isSender ? 'bg-blue-600' : 'bg-gray-100'} cursor-pointer hover:opacity-80 transition`}
      onClick={() => downloadFile(message.mediaUrl, message.mediaName)}
    >
      <div className="text-2xl">{getFileIcon(message.mediaName)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{message.mediaName || 'File'}</p>
        <p className="text-xs opacity-70">{formatFileSize(message.mediaSize)}</p>
      </div>
      <FaDownload className="opacity-70" size={14} />
    </div>
  );
};

export default MediaPreview;