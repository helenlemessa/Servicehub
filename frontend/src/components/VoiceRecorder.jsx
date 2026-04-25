// frontend/src/components/VoiceRecorder.jsx - WITH DARK MODE
import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaTrash, FaPlay, FaPause } from 'react-icons/fa';

const VoiceRecorder = ({ onSend, onCancel, isDark = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Theme-based classes
  const bgColor = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-600' : 'border-gray-300';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      };
      audioRef.current.addEventListener('ended', handleEnded);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioRef.current]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      setHasRecorded(false);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setAudioBlob(audioBlob);
        setIsRecording(false);
        setHasRecorded(true);
        
        if (startTimeRef.current) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(duration);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPlaying(false);
    setHasRecorded(false);
    onCancel();
  };

  const sendRecording = () => {
    if (audioBlob && recordingTime > 0) {
      const fileName = `voice_${Date.now()}.mp3`;
      const file = new File([audioBlob], fileName, { type: 'audio/mp3' });
      onSend(file, recordingTime);
      cancelRecording();
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && !hasRecorded) {
    return (
      <button
        onClick={startRecording}
        className={`p-2 ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'} transition`}
        title="Voice Message"
      >
        <FaMicrophone size={20} />
      </button>
    );
  }

  if (isRecording) {
    return (
      <div className={`flex items-center gap-2 ${bgColor} rounded-lg px-3 py-2`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className={`text-sm font-medium text-red-500`}>Recording</span>
          <span className={`text-sm ${textMuted}`}>{formatTime(recordingTime)}</span>
        </div>
        <button
          onClick={stopRecording}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          title="Stop Recording"
        >
          <FaStop size={12} />
        </button>
        <button
          onClick={cancelRecording}
          className="p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
          title="Cancel"
        >
          <FaTrash size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${bgColor} rounded-lg px-3 py-2`}>
      <audio
        ref={audioRef}
        src={audioURL}
        preload="metadata"
        style={{ display: 'none' }}
      />
      <button
        onClick={togglePlayback}
        className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
      </button>
      <span className={`text-sm font-mono ${textColor}`}>
        {formatTime(recordingTime)}
      </span>
      <button
        onClick={sendRecording}
        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
      >
        Send ({formatTime(recordingTime)})
      </button>
      <button
        onClick={cancelRecording}
        className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
      >
        Cancel
      </button>
    </div>
  );
};

export default VoiceRecorder;