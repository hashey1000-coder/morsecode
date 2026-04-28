'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--',
  '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-',
  _: '..--.-', '"': '.-..-.', '@': '.--.-.',
};

const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResultLike = { isFinal: boolean; 0: SpeechRecognitionAlternative };
type SpeechRecognitionEventLike = Event & { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionErrorEventLike = Event & { error: string };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type EnvelopeData = { data: Float32Array; windowMs: number };
type DecodeOptions = { manualWpm: boolean; wpm: number; minVolume: number; maxVolume: number; volumeThreshold: number };
type DecodeResult = { morse: string; text: string; dotMs: number; error?: string };
type ToastState = { message: string; visible: boolean };

function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\n/)
    .map((line) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.split('').map((char) => MORSE[char] || '').filter(Boolean).join(' '))
        .join(' / ')
    )
    .join('\n');
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
            .map((code) => REVERSE[code] || '?')
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

function computeEnvelope(samples: Float32Array, sampleRate: number, targetFrequency: number): EnvelopeData {
  const windowMs = 4;
  const windowSize = Math.max(1, Math.floor((sampleRate * windowMs) / 1000));
  const envelope = new Float32Array(Math.floor(samples.length / windowSize));

  for (let i = 0; i < envelope.length; i += 1) {
    const start = i * windowSize;
    let real = 0;
    let imag = 0;
    for (let j = 0; j < windowSize; j += 1) {
      const sample = samples[start + j] ?? 0;
      const time = (start + j) / sampleRate;
      const phase = 2 * Math.PI * targetFrequency * time;
      real += sample * Math.cos(phase);
      imag += sample * Math.sin(phase);
    }
    envelope[i] = Math.sqrt(real * real + imag * imag) / windowSize;
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

  return { data: smoothed, windowMs };
}

function normalizeEnvelope(value: number, minVolume: number, maxVolume: number): number {
  const db = 20 * Math.log10(Math.max(value, 1e-6));
  const clamped = Math.min(maxVolume, Math.max(minVolume, db));
  return (clamped - minVolume) / Math.max(1, maxVolume - minVolume);
}

function buildSegments(envelope: EnvelopeData, options: DecodeOptions) {
  const threshold = Math.min(0.95, Math.max(0.02, options.volumeThreshold / 400));
  const values = Array.from(envelope.data, (sample) => normalizeEnvelope(sample, options.minVolume, options.maxVolume));
  const segments: Array<{ on: boolean; durMs: number }> = [];
  let currentOn = values[0] > threshold;
  let currentStart = 0;

  for (let i = 1; i < values.length; i += 1) {
    const on = values[i] > threshold;
    if (on !== currentOn) {
      segments.push({ on: currentOn, durMs: (i - currentStart) * envelope.windowMs });
      currentOn = on;
      currentStart = i;
    }
  }

  segments.push({ on: currentOn, durMs: (values.length - currentStart) * envelope.windowMs });
  return segments;
}

function decodeFromEnvelope(envelope: EnvelopeData, options: DecodeOptions): DecodeResult {
  let segments = buildSegments(envelope, options);
  while (segments.length && !segments[0].on) segments.shift();
  while (segments.length && !segments[segments.length - 1].on) segments.pop();
  if (!segments.length) return { morse: '', text: '', dotMs: 0, error: 'No tones detected' };

  const cleaned: Array<{ on: boolean; durMs: number }> = [];
  for (const segment of segments) {
    if (segment.durMs < 12) {
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
  const autoDotMs = percentile(0.2);
  const dotMs = options.manualWpm ? 1200 / Math.max(5, options.wpm) : autoDotMs;
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
  return { morse, text: morseToText(morse), dotMs };
}

function MorseMarkup({ value, emptyText }: { value: string; emptyText: string }) {
  if (!value) return <>{emptyText}</>;

  return (
    <>
      {value.split('').map((char, index) =>
        char === '/' ? (
          <span key={`slash-${index}`} className="mvt-slash">/</span>
        ) : (
          <span key={`char-${index}`}>{char}</span>
        )
      )}
    </>
  );
}

export default function MorseAudioVoiceTranslator() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const uploadAudioBufferRef = useRef<AudioBuffer | null>(null);
  const uploadPlaySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const uploadPlayStopRef = useRef<number | null>(null);
  const morseOscillatorsRef = useRef<OscillatorNode[] | null>(null);
  const morseStopTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [decodedMorse, setDecodedMorse] = useState('');
  const [fileName, setFileName] = useState('');
  const [isFilePlaying, setIsFilePlaying] = useState(false);
  const [isMorsePlaying, setIsMorsePlaying] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const [wpm, setWpm] = useState(20);
  const [manualWpm, setManualWpm] = useState(true);
  const [farnsworthWpm, setFarnsworthWpm] = useState(20);
  const [frequency, setFrequency] = useState(563);
  const [manualFrequency, setManualFrequency] = useState(true);
  const [minVolume, setMinVolume] = useState(-60);
  const [maxVolume, setMaxVolume] = useState(-30);
  const [volumeThreshold, setVolumeThreshold] = useState(200);
  const [lastMixedSamples, setLastMixedSamples] = useState<Float32Array | null>(null);
  const [lastSampleRate, setLastSampleRate] = useState(0);

  const liveText = useMemo(() => `${finalTranscript}${interimTranscript}`.trim(), [finalTranscript, interimTranscript]);
  const voiceMorse = useMemo(() => textToMorse(liveText), [liveText]);
  const outputText = decodedText || liveText;
  const outputMorse = decodedMorse || voiceMorse;

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let nextFinal = '';
      let nextInterim = '';

      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) nextFinal += result[0].transcript;
        else nextInterim += result[0].transcript;
      }

      setDecodedText('');
      setDecodedMorse('');
      setFinalTranscript(nextFinal);
      setInterimTranscript(nextInterim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') showToast('Microphone access denied');
      stopListening();
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch {}
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      stopFileAudio();
      stopMorseAudio();
      if (audioCtxRef.current) void audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (lastMixedSamples && lastSampleRate) rerunAudioDecode(lastMixedSamples, lastSampleRate);
  }, [wpm, manualWpm, frequency, manualFrequency, minVolume, maxVolume, volumeThreshold]);

  function showToast(message: string) {
    setToast({ message, visible: true });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 1600);
  }

  function ensureAudioContext(): AudioContext {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }

  function startListening() {
    if (!recognitionRef.current) return;
    shouldListenRef.current = true;
    setDecodedText('');
    setDecodedMorse('');
    setFinalTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {}
  }

  function stopListening() {
    shouldListenRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {}
    const text = `${finalTranscript}${interimTranscript}`.trim();
    setFinalTranscript(text);
    setInterimTranscript('');
  }

  async function copyValue(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('COPIED');
    } catch {
      showToast('COPY FAILED');
    }
  }

  function clearMessage() {
    shouldListenRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {}
    setFinalTranscript('');
    setInterimTranscript('');
    setDecodedText('');
    setDecodedMorse('');
    setFileName('');
    setLastMixedSamples(null);
    setLastSampleRate(0);
    uploadAudioBufferRef.current = null;
    stopFileAudio();
    stopMorseAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function stopFileAudio() {
    setIsFilePlaying(false);
    if (uploadPlaySourceRef.current) {
      try {
        uploadPlaySourceRef.current.stop();
      } catch {}
      uploadPlaySourceRef.current = null;
    }
    if (uploadPlayStopRef.current) {
      window.clearTimeout(uploadPlayStopRef.current);
      uploadPlayStopRef.current = null;
    }
  }

  async function playUploadedAudio() {
    const context = ensureAudioContext();
    const buffer = uploadAudioBufferRef.current;
    if (!buffer) return;
    if (uploadPlaySourceRef.current) {
      stopFileAudio();
      return;
    }
    if (context.state === 'suspended') await context.resume();

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      uploadPlaySourceRef.current = null;
      setIsFilePlaying(false);
    };
    source.start();
    uploadPlaySourceRef.current = source;
    setIsFilePlaying(true);
    uploadPlayStopRef.current = window.setTimeout(() => {
      stopFileAudio();
    }, buffer.duration * 1000 + 100);
  }

  function scheduleBeep(context: AudioContext, startTime: number, durationMs: number, oscillators: OscillatorNode[]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const end = startTime + durationMs / 1000;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.004);
    gain.gain.setValueAtTime(0.22, end - 0.004);
    gain.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(end + 0.01);
    oscillators.push(oscillator);
  }

  async function playMorse() {
    const context = ensureAudioContext();
    if (!outputMorse) return;
    if (morseOscillatorsRef.current) {
      stopMorseAudio();
      return;
    }
    if (context.state === 'suspended') await context.resume();
    setIsMorsePlaying(true);

    const dot = 1200 / Math.max(5, wpm);
    const farnsworthDot = farnsworthWpm < wpm ? 1200 / Math.max(5, farnsworthWpm) : dot;
    const dash = dot * 3;
    const intra = dot;
    const interLetter = farnsworthDot * 3;
    const interWord = farnsworthDot * 7;
    let timeline = context.currentTime + 0.05;
    const oscillators: OscillatorNode[] = [];

    for (const char of outputMorse) {
      if (char === '.') {
        scheduleBeep(context, timeline, dot, oscillators);
        timeline += (dot + intra) / 1000;
      } else if (char === '-') {
        scheduleBeep(context, timeline, dash, oscillators);
        timeline += (dash + intra) / 1000;
      } else if (char === ' ') {
        timeline += (interLetter - intra) / 1000;
      } else if (char === '/') {
        timeline += (interWord - intra) / 1000;
      } else if (char === '\n') {
        timeline += interWord / 1000;
      }
    }

    morseOscillatorsRef.current = oscillators;
    morseStopTimeoutRef.current = window.setTimeout(() => {
      stopMorseAudio();
    }, (timeline - context.currentTime + 0.15) * 1000);
  }

  function stopMorseAudio() {
    setIsMorsePlaying(false);
    if (morseOscillatorsRef.current) {
      morseOscillatorsRef.current.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {}
      });
      morseOscillatorsRef.current = null;
    }
    if (morseStopTimeoutRef.current) {
      window.clearTimeout(morseStopTimeoutRef.current);
      morseStopTimeoutRef.current = null;
    }
  }

  function rerunAudioDecode(samples: Float32Array, sampleRate: number) {
    const tone = manualFrequency ? frequency : detectDominantFrequency(samples, sampleRate);
    const envelope = computeEnvelope(samples, sampleRate, tone);
    const result = decodeFromEnvelope(envelope, { manualWpm, wpm, minVolume, maxVolume, volumeThreshold });

    if (result.error) {
      setDecodedText('');
      setDecodedMorse('');
      showToast(result.error.toUpperCase());
      return;
    }

    setDecodedText(result.text);
    setDecodedMorse(result.morse);
    if (!manualFrequency) setFrequency(Math.round(tone));
  }

  async function handleUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|ogg|m4a|webm|aac|flac)$/i.test(file.name)) {
      showToast('AUDIO FILE REQUIRED');
      return;
    }

    try {
      const context = ensureAudioContext();
      if (context.state === 'suspended') await context.resume();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
      uploadAudioBufferRef.current = audioBuffer;
      setFileName(file.name);

      const mono = new Float32Array(audioBuffer.length);
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
        const source = audioBuffer.getChannelData(channel);
        for (let i = 0; i < audioBuffer.length; i += 1) mono[i] += source[i];
      }
      if (audioBuffer.numberOfChannels > 1) {
        for (let i = 0; i < audioBuffer.length; i += 1) mono[i] /= audioBuffer.numberOfChannels;
      }

      setLastMixedSamples(mono);
      setLastSampleRate(audioBuffer.sampleRate);
      setFinalTranscript('');
      setInterimTranscript('');
      rerunAudioDecode(mono, audioBuffer.sampleRate);
    } catch (error) {
      console.error(error);
      showToast('COULD NOT DECODE AUDIO');
    }
  }

  return (
    <section className="mvt-shell">
      <div className="mvt-progress" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span className="active" />
      </div>

      {!isSupported && (
        <div className="mvt-not-supported">Your browser doesn&apos;t support the Web Speech API. Please try Chrome, Edge, or Safari on desktop or Android.</div>
      )}

      <div className="mvt-control-strip">
        <button type="button" className="mvt-primary-btn" onClick={startListening} disabled={!isSupported || isListening}>Listen</button>
        <button type="button" className="mvt-secondary-btn" onClick={stopListening} disabled={!isListening}>Stop</button>
      </div>

      <div className={`mvt-mic-area ${isListening ? 'active' : ''}`}>
        <div className={`mvt-live-text ${isListening || liveText ? 'show' : ''}`}>
          <span>{finalTranscript}</span>
          <span className="interim">{interimTranscript}</span>
          {isListening && <span className="mvt-cursor" />}
        </div>
      </div>

      <div className="mvt-file-label">Or analyse an audio file containing Morse code:</div>
      <div className="mvt-control-strip wrap">
        <input ref={fileInputRef} type="file" hidden accept="audio/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.currentTarget.value = '';
        }} />
        <button type="button" className="mvt-primary-btn" onClick={() => fileInputRef.current?.click()}>Upload</button>
        <button type="button" className="mvt-secondary-btn" onClick={() => void playUploadedAudio()} disabled={!uploadAudioBufferRef.current}>{isFilePlaying ? 'Stop' : 'Play'}</button>
        <button type="button" className="mvt-secondary-btn" onClick={stopFileAudio} disabled={!isFilePlaying}>Stop</button>
      </div>

      <div className="mvt-filename-row">
        <span className="label">Filename:</span>
        <span className="value">{fileName || '—'}</span>
      </div>

      <div className="mvt-control-strip wrap lower">
        <button type="button" className="mvt-secondary-btn" onClick={clearMessage}>Clear Message</button>
        <button type="button" className="mvt-secondary-btn" onClick={() => void playMorse()} disabled={!outputMorse}>{isMorsePlaying ? 'Stop Morse' : 'Play Morse'}</button>
      </div>

      <div className="mvt-settings-grid">
        <label className="mvt-setting">
          <span>WPM</span>
          <input type="range" min={5} max={40} value={wpm} onChange={(event) => setWpm(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{wpm}</strong><button type="button" className={`mvt-mini-btn ${manualWpm ? 'active' : ''}`} onClick={() => setManualWpm((current) => !current)}>Manual</button></div>
        </label>

        <label className="mvt-setting">
          <span>Farnsworth WPM</span>
          <input type="range" min={5} max={40} value={farnsworthWpm} onChange={(event) => setFarnsworthWpm(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{farnsworthWpm}</strong></div>
        </label>

        <label className="mvt-setting">
          <span>Frequency (Hz)</span>
          <input type="range" min={300} max={1200} value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{frequency}</strong><button type="button" className={`mvt-mini-btn ${manualFrequency ? 'active' : ''}`} onClick={() => setManualFrequency((current) => !current)}>Manual</button></div>
        </label>

        <label className="mvt-setting">
          <span>Minimum volume</span>
          <input type="range" min={-80} max={-10} value={minVolume} onChange={(event) => setMinVolume(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{minVolume}</strong></div>
        </label>

        <label className="mvt-setting">
          <span>Maximum volume</span>
          <input type="range" min={-80} max={0} value={maxVolume} onChange={(event) => setMaxVolume(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{maxVolume}</strong></div>
        </label>

        <label className="mvt-setting">
          <span>Volume threshold</span>
          <input type="range" min={0} max={400} value={volumeThreshold} onChange={(event) => setVolumeThreshold(Number(event.target.value))} />
          <div className="mvt-setting-footer"><strong>{volumeThreshold}</strong></div>
        </label>
      </div>

      <div className={`mvt-output-section ${outputText || outputMorse ? 'show' : ''}`}>
        <div className="mvt-panel">
          <div className="mvt-panel-label">
            <span className="name">Recognised text</span>
            <button type="button" className="mvt-icon-btn" onClick={() => void copyValue(outputText)} disabled={!outputText}>Copy</button>
          </div>
          <div className={`mvt-text-out ${outputText ? '' : 'empty'}`}>{outputText || '—'}</div>
        </div>

        <div className="mvt-panel">
          <div className="mvt-panel-label">
            <span className="name">Morse code</span>
            <button type="button" className="mvt-icon-btn" onClick={() => void copyValue(outputMorse)} disabled={!outputMorse}>Copy</button>
          </div>
          <div className={`mvt-morse-out ${outputMorse ? '' : 'empty'}`}><MorseMarkup value={outputMorse} emptyText="— speak or upload to see Morse code —" /></div>
        </div>
      </div>

      <div className="mvt-footer">International Morse Code <span className="sep">·</span> 100% browser-based <span className="sep">·</span> nothing leaves your device</div>
      <div className={`mvt-toast ${toast.visible ? 'show' : ''}`}>{toast.message}</div>

      <style jsx>{`
        .mvt-shell {
          --bg-0: #070b1f;
          --bg-1: #0c1230;
          --bg-2: #111a3f;
          --panel: rgba(20, 28, 64, 0.45);
          --border: rgba(147, 165, 207, 0.18);
          --text: #ffffff;
          --muted: #9aa9cc;
          --muted-2: #6b7aa0;
          --accent: #818cf8;
          --accent-hi: #a5b1ff;
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
        .mvt-progress { display: flex; gap: 8px; margin-bottom: 28px; }
        .mvt-progress span { height: 4px; width: 36px; border-radius: 2px; background: rgba(147, 165, 207, 0.25); }
        .mvt-progress span.active { background: var(--accent); box-shadow: 0 0 12px rgba(129, 140, 248, 0.35); width: 16px; }
        .mvt-not-supported { padding: 16px 18px; margin-bottom: 16px; border-radius: 12px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.24); color: #fca5a5; }
        .mvt-control-strip { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
        .mvt-control-strip.wrap { flex-wrap: wrap; }
        .mvt-control-strip.lower { margin-bottom: 18px; }
        .mvt-primary-btn, .mvt-secondary-btn, .mvt-icon-btn, .mvt-mini-btn { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; letter-spacing: 0.05em; border-radius: 10px; transition: all 0.2s ease; }
        .mvt-primary-btn, .mvt-secondary-btn, .mvt-icon-btn { padding: 10px 14px; }
        .mvt-primary-btn { border: 1px solid transparent; background: linear-gradient(135deg, var(--accent), #6366f1); color: white; cursor: pointer; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25); }
        .mvt-secondary-btn, .mvt-icon-btn, .mvt-mini-btn { border: 1px solid var(--border); background: rgba(20, 28, 64, 0.45); color: var(--text); cursor: pointer; }
        .mvt-primary-btn:disabled, .mvt-secondary-btn:disabled, .mvt-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .mvt-mini-btn { padding: 5px 9px; }
        .mvt-mini-btn.active { border-color: var(--accent); color: var(--accent-hi); }
        .mvt-mic-area { margin-bottom: 20px; border: 1.5px dashed var(--border); border-radius: 18px; background: var(--panel); padding: 18px; }
        .mvt-mic-area.active { border-color: rgba(239, 68, 68, 0.35); }
        .mvt-live-text { min-height: 64px; display: none; border-radius: 12px; background: rgba(7, 11, 31, 0.5); padding: 16px 18px; font-size: 17px; line-height: 1.6; }
        .mvt-live-text.show { display: block; }
        .mvt-live-text .interim { color: var(--muted-2); }
        .mvt-cursor { display: inline-block; width: 2px; height: 1.1em; background: var(--accent); margin-left: 2px; vertical-align: text-bottom; animation: mvt-blink 1s steps(2) infinite; }
        .mvt-file-label { margin: 6px 0 12px; color: var(--muted); font-size: 15px; }
        .mvt-filename-row { display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: rgba(20, 28, 64, 0.35); margin-bottom: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; }
        .mvt-filename-row .label { color: var(--muted); }
        .mvt-filename-row .value { color: var(--text); word-break: break-all; }
        .mvt-settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
        .mvt-setting { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 16px; border: 1px solid var(--border); background: rgba(20, 28, 64, 0.32); }
        .mvt-setting span { font-size: 13px; color: var(--muted); }
        .mvt-setting input[type='range'] { width: 100%; }
        .mvt-setting-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .mvt-output-section { display: none; margin-top: 22px; }
        .mvt-output-section.show { display: block; }
        .mvt-panel { background: var(--panel); border: 1.5px dashed var(--border); border-radius: 18px; padding: 22px; margin-bottom: 16px; }
        .mvt-panel-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .mvt-panel-label .name { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-2); }
        .mvt-text-out { font-size: 18px; line-height: 1.6; word-break: break-word; }
        .mvt-text-out.empty { color: var(--muted-2); }
        .mvt-morse-out { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 19px; line-height: 1.9; letter-spacing: 0.07em; white-space: pre-wrap; word-break: break-word; }
        .mvt-morse-out.empty { color: var(--muted-2); font-size: 14px; letter-spacing: 0.03em; }
        .mvt-slash { color: var(--muted-2); }
        .mvt-footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); text-align: center; color: var(--muted-2); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; }
        .mvt-footer .sep { margin: 0 10px; opacity: 0.5; }
        .mvt-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--bg-2); border: 1px solid var(--accent); color: var(--accent-hi); padding: 10px 18px; border-radius: 100px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; opacity: 0; pointer-events: none; transition: all 0.3s ease; z-index: 60; }
        .mvt-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        @keyframes mvt-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @media (max-width: 600px) {
          .mvt-shell { padding: 24px 16px 22px; }
          .mvt-progress span { width: 24px; }
          .mvt-panel-label, .mvt-control-strip { flex-wrap: wrap; }
        }
      `}</style>
    </section>
  );
}