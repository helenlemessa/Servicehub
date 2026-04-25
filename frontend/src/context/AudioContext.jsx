import { createContext, useContext, useRef, useState } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentAudioRef = useRef(null);
  const updateIntervalRef = useRef(null);

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setCurrentPlayingId(null);
    setCurrentTime(0);
  };

  const playAudio = (messageId, audioUrl, onTimeUpdate, onEnded) => {
    // Stop any currently playing audio
    stopCurrentAudio();

    // Create new audio instance
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
      stopCurrentAudio();
      if (onEnded) onEnded();
    });

    audio.play();
    currentAudioRef.current = audio;
    setCurrentPlayingId(messageId);
    
    // Update time every 100ms for smooth counter
    updateIntervalRef.current = setInterval(() => {
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        const time = currentAudioRef.current.currentTime;
        setCurrentTime(time);
        if (onTimeUpdate) onTimeUpdate(time);
      }
    }, 100);

    return audio;
  };

  const pauseAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }
  };

  const resumeAudio = () => {
    if (currentAudioRef.current && currentAudioRef.current.paused) {
      currentAudioRef.current.play();
      updateIntervalRef.current = setInterval(() => {
        if (currentAudioRef.current && !currentAudioRef.current.paused) {
          setCurrentTime(currentAudioRef.current.currentTime);
        }
      }, 100);
    }
  };

  const seekAudio = (time) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const value = {
    currentPlayingId,
    currentTime,
    duration,
    playAudio,
    pauseAudio,
    resumeAudio,
    seekAudio,
    stopCurrentAudio,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};