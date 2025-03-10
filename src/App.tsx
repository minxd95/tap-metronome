import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import clickSound from "./assets/sounds/click.mp3";

function App() {
  const [bpm, setBpm] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    audioRef.current = new Audio(clickSound);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  const startMetronome = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      setCurrentBeat(0);
    }

    const interval = 60000 / bpm; // 밀리초 단위의 간격

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentBeat((prev) => (prev + 1) % beatsPerMeasure);

      if (audioRef.current) {
        // 오디오 재생을 위해 오디오 요소를 복제하고 재생
        const sound = audioRef.current.cloneNode() as HTMLAudioElement;
        sound.play();
      }
    }, interval);
  }, [bpm, beatsPerMeasure, isPlaying]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  const handleTap = useCallback(() => {
    const now = Date.now();

    tapsRef.current = [...tapsRef.current, now].slice(-4); // 최대 4개의 탭만 저장

    if (tapsRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }

      const averageInterval =
        intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      // BPM 범위 제한 (20-300)
      if (calculatedBpm >= 20 && calculatedBpm <= 300) {
        setBpm(calculatedBpm);
      }
    }
  }, []);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBpm(value);
  };

  const handleBeatsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBeatsPerMeasure(parseInt(e.target.value, 10));
  };

  return (
    <div className="app">
      <h1>탭 메트로놈</h1>

      <div className="bpm-display">
        <span>{bpm} BPM</span>
      </div>

      <div className="beats-container">
        {Array.from({ length: beatsPerMeasure }).map((_, index) => (
          <div
            key={index}
            className={`beat ${
              currentBeat === index && isPlaying ? "active" : ""
            }`}
          />
        ))}
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="bpm-slider">BPM:</label>
          <input
            id="bpm-slider"
            type="range"
            min="20"
            max="300"
            value={bpm}
            onChange={handleBpmChange}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label htmlFor="beats-select">박자:</label>
          <select
            id="beats-select"
            value={beatsPerMeasure}
            onChange={handleBeatsChange}
            className="select"
          >
            <option value="2">2/4</option>
            <option value="3">3/4</option>
            <option value="4">4/4</option>
            <option value="5">5/4</option>
            <option value="6">6/8</option>
          </select>
        </div>
      </div>

      <div className="buttons">
        <button
          className={`play-button ${isPlaying ? "stop" : "play"}`}
          onClick={toggleMetronome}
        >
          {isPlaying ? "중지" : "재생"}
        </button>

        <button className="tap-button" onClick={handleTap}>
          탭
        </button>
      </div>
    </div>
  );
}

export default App;
