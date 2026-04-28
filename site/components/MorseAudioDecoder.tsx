'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.',
  $: '...-..-', '@': '.--.-.',
};

const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

type EnvelopeData = {
  data: Float32Array;
  windowMs: number;
  totalDurMs: number;
};

type DecodeResult = {
  morse: string;
  text: string;
  dotMs: number;
  error?: string;
};

type ToastState = {
  message: string;
  error: boolean;
  visible: boolean;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function morseToText(morse: string): string {
  return morse
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s*\/\s*/)
        .map((word) =>
          word
            .split(/\s+/)
            .filter(Boolean)
            .map((code) => REVERSE[code] ?? '?')
            .join('')
        )
        .join(' ')
    )
    .join('\n');
}

function detectDominantFrequency(samples: Float32Array, sampleRate: number): number {
  const sampleWindow = Math.min(samples.length, Math.floor(sampleRate * 2));
  const segment = samples.subarray(0, sampleWindow);
  let bestFreq = 600;
  let bestMagnitude = 0;

  for (let freq = 300; freq <= 1200; freq += 20) {
    const omega = (2 * Math.PI * freq) / sampleRate;
    const coefficient = 2 * Math.cos(omega);
    let q0 = 0;
    let q1 = 0;
    let q2 = 0;

    for (let i = 0; i < sampleWindow; i += 1) {
      q0 = coefficient * q1 - q2 + segment[i];
      q2 = q1;
      q1 = q0;
    }

    const magnitude = q1 * q1 + q2 * q2 - q1 * q2 * coefficient;
    if (magnitude > bestMagnitude) {
      bestMagnitude = magnitude;
      bestFreq = freq;
    }
  }

  return bestFreq;
}

function computeEnvelope(samples: Float32Array, sampleRate: number): EnvelopeData {
  const windowMs = 4;
  const windowSize = Math.max(1, Math.floor((sampleRate * windowMs) / 1000));
  const envelope = new Float32Array(Math.floor(samples.length / windowSize));

  for (let i = 0; i < envelope.length; i += 1) {
    let sum = 0;
    const start = i * windowSize;
    for (let j = 0; j < windowSize; j += 1) {
      const sample = samples[start + j] ?? 0;
      sum += sample * sample;
    }
    envelope[i] = Math.sqrt(sum / windowSize);
  }

  const smoothed = new Float32Array(envelope.length);
  const smoothWindow = 4;
  for (let i = 0; i < envelope.length; i += 1) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - smoothWindow); j <= Math.min(envelope.length - 1, i + smoothWindow); j += 1) {
      sum += envelope[j];
      count += 1;
    }
    smoothed[i] = count ? sum / count : 0;
  }

  return { data: smoothed, windowMs, totalDurMs: smoothed.length * windowMs };
}

function buildSegments(envelope: EnvelopeData, threshold: number) {
  if (!envelope.data.length) return [] as Array<{ on: boolean; durMs: number }>;

  const segments: Array<{ on: boolean; durMs: number }> = [];
  let currentOn = envelope.data[0] > threshold;
  let currentStart = 0;

  for (let i = 1; i < envelope.data.length; i += 1) {
    const on = envelope.data[i] > threshold;
    if (on !== currentOn) {
      segments.push({ on: currentOn, durMs: (i - currentStart) * envelope.windowMs });
      currentOn = on;
      currentStart = i;
    }
  }

  segments.push({ on: currentOn, durMs: (envelope.data.length - currentStart) * envelope.windowMs });
  return segments;
}

function decodeFromEnvelope(envelope: EnvelopeData, thresholdFraction: number): DecodeResult {
  const maxValue = envelope.data.reduce((max, value) => (value > max ? value : max), 0);
  if (maxValue < 0.001) return { morse: '', text: '', dotMs: 0, error: 'Audio is silent' };

  const threshold = maxValue * thresholdFraction;
  let segments = buildSegments(envelope, threshold);

  while (segments.length && !segments[0].on) segments.shift();
  while (segments.length && !segments[segments.length - 1].on) segments.pop();
  if (!segments.length) return { morse: '', text: '', dotMs: 0, error: 'No tones detected' };

  const cleaned: Array<{ on: boolean; durMs: number }> = [];
  const minMs = 12;
  for (const segment of segments) {
    if (segment.durMs < minMs) {
      if (cleaned.length) cleaned[cleaned.length - 1].durMs += segment.durMs;
      continue;
    }
    if (cleaned.length && cleaned[cleaned.length - 1].on === segment.on) {
      cleaned[cleaned.length - 1].durMs += segment.durMs;
    } else {
      cleaned.push({ ...segment });
    }
  }

  const onDurations = cleaned.filter((segment) => segment.on).map((segment) => segment.durMs).sort((a, b) => a - b);
  if (!onDurations.length) return { morse: '', text: '', dotMs: 0, error: 'No tones detected' };

  const percentile = (p: number) => onDurations[Math.min(onDurations.length - 1, Math.floor(onDurations.length * p))];
  const dotMs = percentile(0.2);
  const maxOn = onDurations[onDurations.length - 1];
  const dotDashCut = maxOn > dotMs * 1.8 ? dotMs * 2 : dotMs < 100 ? dotMs * 2 : dotMs / 2;
  const letterCut = dotMs * 2;
  const wordCut = dotMs * 5;

  let morse = '';
  for (const segment of cleaned) {
    if (segment.on) {
      morse += segment.durMs < dotDashCut ? '.' : '-';
    } else if (segment.durMs >= wordCut) {
      morse += ' / ';
    } else if (segment.durMs >= letterCut) {
      morse += ' ';
    }
  }

  morse = morse.trim();
  return {
    morse,
    text: morseToText(morse),
    dotMs,
  };
}

function renderTextWithInvalidMarkers(value: string) {
  if (!value) return '—';

  return value.split('').map((char, index) =>
    char === '?' ? (
      <span key={`invalid-${index}`} className="mad-invalid-char">?</span>
    ) : (
      <span key={`char-${index}`}>{char}</span>
    )
  );
}

export default function MorseAudioDecoder() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const playSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [envelope, setEnvelope] = useState<EnvelopeData | null>(null);
  const [detectedTone, setDetectedTone] = useState(0);
  const [currentMorse, setCurrentMorse] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [dotMs, setDotMs] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [sensitivity, setSensitivity] = useState(22);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [toast, setToast] = useState<ToastState>({ message: '', error: false, visible: false });

  const statWpm = useMemo(() => (dotMs > 0 ? Math.round(1200 / dotMs) : null), [dotMs]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (playSourceRef.current) {
        try {
          playSourceRef.current.stop();
        } catch {}
      }
      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!envelope || !canvasRef.current) return;

    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas || !envelope) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;
      const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      context.clearRect(0, 0, cssWidth, cssHeight);

      const maxValue = envelope.data.reduce((max, value) => (value > max ? value : max), 0) || 1;
      const bins = Math.min(Math.max(1, Math.floor(cssWidth)), 220);
      const step = envelope.data.length / bins;
      const barWidth = cssWidth / bins;

      const gradient = context.createLinearGradient(0, 0, 0, cssHeight);
      gradient.addColorStop(0, '#a5b1ff');
      gradient.addColorStop(1, '#6366f1');
      context.fillStyle = gradient;

      for (let i = 0; i < bins; i += 1) {
        let peak = 0;
        const start = Math.floor(i * step);
        const end = Math.floor((i + 1) * step);
        for (let j = start; j < end; j += 1) {
          if (envelope.data[j] > peak) peak = envelope.data[j];
        }
        const height = Math.max(1, (peak / maxValue) * cssHeight * 0.85);
        const y = (cssHeight - height) / 2;
        context.fillRect(i * barWidth + 0.5, y, Math.max(1, barWidth - 1.5), height);
      }
    };

    drawWaveform();
    window.addEventListener('resize', drawWaveform);
    return () => window.removeEventListener('resize', drawWaveform);
  }, [envelope]);

  useEffect(() => {
    if (!envelope) return;
    rerunDecode(envelope, sensitivity / 100);
  }, [sensitivity]);

  function showToast(message: string, error = false) {
    setToast({ message, error, visible: true });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 1800);
  }

  function ensureAudioContext(): AudioContext {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }

  function rerunDecode(nextEnvelope: EnvelopeData, thresholdFraction: number) {
    const result = decodeFromEnvelope(nextEnvelope, thresholdFraction);
    if (result.error) {
      setCurrentMorse('');
      setCurrentText('');
      setDotMs(0);
      return;
    }

    setCurrentMorse(result.morse);
    setCurrentText(result.text);
    setDotMs(result.dotMs);
  }

  async function processFile(file: File) {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|ogg|m4a|webm|aac|flac)$/i.test(file.name)) {
      showToast('Audio file required', true);
      return;
    }

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = ensureAudioContext();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      audioBufferRef.current = decoded;
      processBuffer(decoded);
    } catch (error) {
      console.error(error);
      showToast('Could not decode audio', true);
    } finally {
      setProcessing(false);
    }
  }

  function processBuffer(buffer: AudioBuffer) {
    const mono = new Float32Array(buffer.length);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i += 1) mono[i] += samples[i];
    }
    if (buffer.numberOfChannels > 1) {
      for (let i = 0; i < buffer.length; i += 1) mono[i] /= buffer.numberOfChannels;
    }

    const tone = detectDominantFrequency(mono, buffer.sampleRate);
    const nextEnvelope = computeEnvelope(mono, buffer.sampleRate);

    setDetectedTone(tone);
    setEnvelope(nextEnvelope);
    setDurationSeconds(buffer.duration);
    rerunDecode(nextEnvelope, sensitivity / 100);
  }

  async function togglePlayback() {
    const audioBuffer = audioBufferRef.current;
    if (!audioBuffer) return;

    if (playSourceRef.current) {
      try {
        playSourceRef.current.stop();
      } catch {}
      playSourceRef.current = null;
      setIsPlaying(false);
      return;
    }

    const audioContext = ensureAudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      playSourceRef.current = null;
      setIsPlaying(false);
    };
    source.start();
    playSourceRef.current = source;
    setIsPlaying(true);
  }

  async function copyValue(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('COPIED');
    } catch {
      showToast('COPY FAILED', true);
    }
  }

  function resetAll() {
    if (playSourceRef.current) {
      try {
        playSourceRef.current.stop();
      } catch {}
      playSourceRef.current = null;
    }

    audioBufferRef.current = null;
    setEnvelope(null);
    setDetectedTone(0);
    setCurrentMorse('');
    setCurrentText('');
    setDotMs(0);
    setDurationSeconds(0);
    setIsPlaying(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      recordStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        if (recordStreamRef.current) {
          recordStreamRef.current.getTracks().forEach((track) => track.stop());
          recordStreamRef.current = null;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: blob.type });
        setIsRecording(false);
        setRecordSeconds(0);
        await processFile(file);
      };

      recorder.start();
      setIsRecording(true);
      const startedAt = Date.now();
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((Date.now() - startedAt) / 1000);
      }, 100);
    } catch (error) {
      console.error(error);
      showToast('Microphone access denied', true);
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  const hasResults = !!envelope;
  const morseEmptyMessage = envelope ? '— no tones detected —' : '— no audio loaded —';
  const textEmptyMessage = envelope ? '— no tones detected —' : '— no audio loaded —';

  return (
    <section className="mad-shell">
      <div className="mad-progress" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span className="active" />
      </div>

      <h2 className="mad-title">Decode Morse code from audio</h2>
      <p className="mad-subtitle">
        Drop an audio file or record from your mic. The app finds the tones, measures their timing,
        and decodes the message — all in your browser.
      </p>

      <div
        className={`mad-dropzone ${dragActive ? 'drag' : ''}`}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-rec-button]') || target.closest('[data-rec-overlay]')) return;
          document.getElementById('mad-file-input')?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
      >
        <input
          id="mad-file-input"
          type="file"
          hidden
          accept="audio/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void processFile(file);
            event.currentTarget.value = '';
          }}
        />

        <svg className="mad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v13" />
          <path d="M7 7l5-5 5 5" />
          <path d="M5 21h14a2 2 0 0 0 2-2v-4H3v4a2 2 0 0 0 2 2z" />
        </svg>

        <div className="mad-primary">
          <span className="accent">Drop an audio file here</span>{' '}
          <span className="dim">or click to upload</span>
        </div>
        <div className="mad-meta">WAV, MP3, OGG, M4A — works best on clean tones around 400–900 Hz</div>
        <div className="mad-or">OR</div>

        <button type="button" data-rec-button className={`mad-rec-btn ${isRecording ? 'recording' : ''}`} onClick={(event) => {
          event.stopPropagation();
          if (!isRecording) void startRecording();
        }}>
          <span className="dot" /> RECORD FROM MIC
        </button>

        <div data-rec-overlay className={`mad-rec-overlay ${isRecording ? 'show' : ''}`}>
          <div className="pulse">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /><path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z" /></svg>
          </div>
          <div className="mad-rec-timer">{recordSeconds.toFixed(1)}s</div>
          <button type="button" className="mad-stop-btn" onClick={(event) => {
            event.stopPropagation();
            stopRecording();
          }}>
            STOP RECORDING
          </button>
        </div>
      </div>

      <div className={`mad-processing ${processing ? 'show' : ''}`}>
        <div className="spinner" />
        <span>Analyzing audio…</span>
      </div>

      <div className={`mad-results ${hasResults ? 'show' : ''}`}>
        <div className="mad-stat-row">
          <div className="mad-stat"><div className="label">Duration</div><div className="value">{hasResults ? durationSeconds.toFixed(2) : '—'}<span className="unit">s</span></div></div>
          <div className="mad-stat"><div className="label">Detected speed</div><div className="value">{statWpm ?? '—'}<span className="unit">wpm</span></div></div>
          <div className="mad-stat"><div className="label">Dot unit</div><div className="value">{dotMs ? Math.round(dotMs) : '—'}<span className="unit">ms</span></div></div>
          <div className="mad-stat"><div className="label">Tone</div><div className="value">{detectedTone ? Math.round(detectedTone) : '—'}<span className="unit">Hz</span></div></div>
        </div>

        <div className="mad-panel">
          <div className="mad-panel-label">
            <span className="name">Waveform</span>
            <button type="button" className="mad-icon-btn" onClick={() => void togglePlayback()}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              )}
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>
          </div>
          <canvas ref={canvasRef} className="mad-waveform" />
        </div>

        <div className="mad-tuning">
          <span className="label">Sensitivity</span>
          <input type="range" min={5} max={60} value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} />
          <span className="value">{sensitivity}%</span>
        </div>

        <div className="mad-panel">
          <div className="mad-panel-label">
            <span className="name">Decoded Morse</span>
            <button type="button" className="mad-icon-btn" onClick={() => void copyValue(currentMorse)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              COPY
            </button>
          </div>
          <div className={`mad-morse-out ${currentMorse ? '' : 'empty'}`}>{currentMorse || morseEmptyMessage}</div>
        </div>

        <div className="mad-panel">
          <div className="mad-panel-label">
            <span className="name">Decoded text</span>
            <button type="button" className="mad-icon-btn" onClick={() => void copyValue(currentText)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              COPY
            </button>
          </div>
          <div className={`mad-text-out ${currentText ? '' : 'empty'}`}>{currentText ? renderTextWithInvalidMarkers(currentText) : textEmptyMessage}</div>
        </div>

        <div className="mad-btn-row">
          <button type="button" className="mad-icon-btn" onClick={resetAll}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            DECODE ANOTHER
          </button>
        </div>
      </div>

      <div className="mad-footer">International Morse Code <span className="sep">·</span> 100% browser-based <span className="sep">·</span> nothing leaves your device</div>

      <div className={`mad-toast ${toast.visible ? 'show' : ''} ${toast.error ? 'error' : ''}`}>{toast.message}</div>

      <style jsx>{`
        .mad-shell {
          --bg-0: #070b1f;
          --bg-1: #0c1230;
          --bg-2: #111a3f;
          --panel: rgba(20, 28, 64, 0.45);
          --panel-hi: rgba(28, 38, 80, 0.6);
          --border: rgba(147, 165, 207, 0.18);
          --border-hi: rgba(147, 165, 207, 0.4);
          --text: #ffffff;
          --muted: #9aa9cc;
          --muted-2: #6b7aa0;
          --accent: #818cf8;
          --accent-hi: #a5b1ff;
          --accent-glow: rgba(129, 140, 248, 0.35);
          --danger: #f87171;
          --rec: #ef4444;
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(129, 140, 248, 0.18);
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(129, 140, 248, 0.12), transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(99, 102, 241, 0.08), transparent 60%),
            linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--text);
          padding: 32px 24px 28px;
          box-shadow: 0 24px 60px -24px rgba(11, 20, 55, 0.58);
        }
        .mad-progress { display: flex; gap: 8px; margin-bottom: 28px; }
        .mad-progress span { height: 4px; width: 36px; border-radius: 2px; background: rgba(147, 165, 207, 0.25); transition: all 0.3s ease; }
        .mad-progress span.active { background: var(--accent); box-shadow: 0 0 12px var(--accent-glow); width: 16px; }
        .mad-title { font-size: clamp(32px, 4.5vw, 48px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 14px; }
        .mad-subtitle { color: var(--muted); font-size: 17px; line-height: 1.55; max-width: 680px; margin-bottom: 36px; }
        .mad-dropzone {
          border: 1.5px dashed var(--border);
          border-radius: 18px;
          background: var(--panel);
          padding: 56px 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .mad-dropzone:hover, .mad-dropzone.drag {
          border-color: var(--accent);
          background: var(--panel-hi);
          box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.06);
        }
        .mad-icon { width: 44px; height: 44px; color: var(--accent); margin: 0 auto 18px; transition: transform 0.25s ease; }
        .mad-dropzone:hover .mad-icon { transform: translateY(-3px); }
        .mad-primary { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .mad-primary .accent { color: var(--text); }
        .mad-primary .dim { color: var(--muted); font-weight: 400; }
        .mad-meta { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; color: var(--muted-2); margin-top: 10px; }
        .mad-or {
          margin: 22px 0 16px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--muted-2);
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .mad-or::before, .mad-or::after { content: ''; flex: 0 0 50px; height: 1px; background: var(--border); }
        .mad-rec-btn {
          background: transparent;
          border: 1px solid var(--border-hi);
          color: var(--text);
          padding: 10px 22px;
          border-radius: 100px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          transition: all 0.2s ease;
        }
        .mad-rec-btn:hover { border-color: var(--rec); color: #fca5a5; background: rgba(239, 68, 68, 0.06); }
        .mad-rec-btn .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--rec); box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
        .mad-rec-btn.recording { border-color: var(--rec); color: #fca5a5; }
        .mad-rec-btn.recording .dot { animation: mad-blink 1s steps(2) infinite; }
        .mad-results { display: none; }
        .mad-results.show { display: block; animation: mad-fadeIn 0.4s ease; }
        .mad-processing {
          display: none;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin: 16px 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 13px;
          color: var(--accent-hi);
        }
        .mad-processing.show { display: flex; }
        .spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: mad-spin 0.8s linear infinite; }
        .mad-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 20px 0; }
        .mad-stat { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
        .mad-stat .label { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 10px; letter-spacing: 0.15em; color: var(--muted-2); margin-bottom: 6px; text-transform: uppercase; }
        .mad-stat .value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 20px; font-weight: 500; color: var(--accent-hi); }
        .mad-stat .unit { font-size: 12px; color: var(--muted-2); margin-left: 3px; }
        .mad-panel { background: var(--panel); border: 1.5px dashed var(--border); border-radius: 18px; padding: 22px; margin-bottom: 16px; }
        .mad-panel-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 10px; flex-wrap: wrap; }
        .mad-panel-label .name { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-2); }
        .mad-waveform { width: 100%; height: 80px; display: block; border-radius: 10px; }
        .mad-morse-out { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 17px; line-height: 1.8; color: var(--text); letter-spacing: 0.05em; word-break: break-word; white-space: pre-wrap; min-height: 30px; }
        .mad-morse-out.empty { color: var(--muted-2); font-size: 14px; }
        .mad-text-out { font-size: 18px; line-height: 1.6; color: var(--text); font-weight: 500; word-break: break-word; white-space: pre-wrap; min-height: 28px; }
        .mad-text-out.empty { color: var(--muted-2); font-weight: 400; }
        .mad-invalid-char { color: var(--danger); background: rgba(248, 113, 113, 0.1); padding: 0 3px; border-radius: 3px; }
        .mad-icon-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 6px 11px;
          border-radius: 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .mad-icon-btn:hover { border-color: var(--accent); color: var(--accent-hi); background: rgba(129, 140, 248, 0.06); }
        .mad-icon-btn svg { width: 12px; height: 12px; }
        .mad-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
        .mad-tuning {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          margin-bottom: 16px;
          background: rgba(20, 28, 64, 0.3);
          border: 1px solid var(--border);
          border-radius: 12px;
          flex-wrap: wrap;
        }
        .mad-tuning .label { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; color: var(--muted-2); text-transform: uppercase; }
        .mad-tuning input[type='range'] {
          flex: 1;
          min-width: 140px;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: var(--border);
          outline: none;
        }
        .mad-tuning input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .mad-tuning input[type='range']::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          border: none;
          cursor: pointer;
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .mad-tuning .value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; color: var(--accent-hi); min-width: 38px; text-align: right; }
        .mad-rec-overlay {
          position: absolute;
          inset: 0;
          background: rgba(7, 11, 31, 0.92);
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          backdrop-filter: blur(4px);
        }
        .mad-rec-overlay.show { display: flex; }
        .mad-rec-overlay .pulse {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--rec);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: mad-pulseRec 1.4s infinite;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mad-rec-overlay .pulse svg { width: 32px; height: 32px; color: white; }
        .mad-rec-timer { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 28px; color: var(--text); margin-bottom: 18px; }
        .mad-stop-btn { background: var(--rec); color: white; border: none; padding: 10px 24px; border-radius: 100px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; letter-spacing: 0.08em; cursor: pointer; font-weight: 600; }
        .mad-footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); text-align: center; color: var(--muted-2); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; letter-spacing: 0.02em; }
        .mad-footer .sep { margin: 0 10px; opacity: 0.5; }
        .mad-toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--bg-2);
          border: 1px solid var(--accent);
          color: var(--accent-hi);
          padding: 10px 18px;
          border-radius: 100px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px var(--accent-glow);
          z-index: 60;
        }
        .mad-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .mad-toast.error { border-color: var(--danger); color: #fca5a5; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(248, 113, 113, 0.3); }
        @keyframes mad-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes mad-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mad-spin { to { transform: rotate(360deg); } }
        @keyframes mad-pulseRec {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { box-shadow: 0 0 0 30px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @media (max-width: 600px) {
          .mad-shell { padding: 24px 16px 22px; }
          .mad-dropzone, .mad-panel { padding: 18px; }
          .mad-dropzone { padding-top: 36px; padding-bottom: 36px; }
          .mad-progress span { width: 24px; }
        }
      `}</style>
    </section>
  );
}