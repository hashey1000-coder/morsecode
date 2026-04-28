'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type HintTone = 'good' | 'bad' | 'muted';

const MORSE_REV: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H',
  '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P',
  '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
  '-....': '6', '--...': '7', '---..': '8', '----.': '9',
  '.-.-.-': '.', '--..--': ',', '..--..': '?', '.----.': "'", '-.-.--': '!', '-..-.': '/',
  '-.--.': '(', '-.--.-': ')', '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=',
  '.-.-.': '+', '-....-': '-', '..--.-': '_', '.-..-.': '"', '.--.-.': '@',
};

function morseToTextSafe(morse: string): string {
  return morse
    .trim()
    .split('/')
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => MORSE_REV[code] || '?')
        .join('')
    )
    .join(' ')
    .trim();
}

function findRegions(counts: Int32Array, minCount: number) {
  const regions: Array<{ start: number; end: number }> = [];
  let start = -1;

  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] >= minCount) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      if (i - start >= 2) regions.push({ start, end: i - 1 });
      start = -1;
    }
  }

  if (start >= 0) regions.push({ start, end: counts.length - 1 });

  const merged: Array<{ start: number; end: number }> = [];
  for (const region of regions) {
    if (merged.length && region.start - merged[merged.length - 1].end < 3) {
      merged[merged.length - 1].end = region.end;
    } else {
      merged.push({ ...region });
    }
  }

  return merged;
}

function splitTwo(arr: number[]) {
  if (arr.length === 0) return { lowMean: 1, highMean: 3, threshold: 2, confidence: 0 };
  if (arr.length === 1) return { lowMean: arr[0], highMean: arr[0] * 3, threshold: arr[0] * 2, confidence: 0.3 };

  let lo = Math.min(...arr);
  let hi = Math.max(...arr);
  if (hi / Math.max(lo, 1) < 1.8) {
    return { lowMean: lo, highMean: hi * 3, threshold: hi * 2, confidence: 0.5 };
  }

  for (let iter = 0; iter < 10; iter += 1) {
    const lowGroup = arr.filter((v) => Math.abs(v - lo) < Math.abs(v - hi));
    const highGroup = arr.filter((v) => Math.abs(v - lo) >= Math.abs(v - hi));
    if (!lowGroup.length || !highGroup.length) break;

    const newLo = lowGroup.reduce((a, b) => a + b, 0) / lowGroup.length;
    const newHi = highGroup.reduce((a, b) => a + b, 0) / highGroup.length;
    if (Math.abs(newLo - lo) < 0.1 && Math.abs(newHi - hi) < 0.1) break;
    lo = newLo;
    hi = newHi;
  }

  const threshold = (lo + hi) / 2;
  const sep = (hi - lo) / Math.max(hi + lo, 1);
  return { lowMean: lo, highMean: hi, threshold, confidence: Math.min(1, sep * 2) };
}

function splitGaps(gaps: number[], dotLen: number) {
  if (!gaps.length) return { small: 2, large: 5 };
  const sorted = [...gaps].sort((a, b) => a - b);
  const unit = Math.max(1, Math.min(dotLen, sorted[0]));
  return { small: unit * 2, large: unit * 5 };
}

function decodeRegion(bin: Uint8Array, width: number, yStart: number, yEnd: number) {
  const colCounts = new Int32Array(width);

  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (bin[y * width + x]) colCounts[x] += 1;
    }
  }

  const minCol = Math.max(1, (yEnd - yStart + 1) * 0.15);
  const runs: Array<{ type: 'mark' | 'gap'; len: number }> = [];
  let currentType: 'mark' | 'gap' = colCounts[0] >= minCol ? 'mark' : 'gap';
  let runLen = 1;

  for (let x = 1; x < width; x += 1) {
    const nextType: 'mark' | 'gap' = colCounts[x] >= minCol ? 'mark' : 'gap';
    if (nextType === currentType) {
      runLen += 1;
    } else {
      runs.push({ type: currentType, len: runLen });
      currentType = nextType;
      runLen = 1;
    }
  }
  runs.push({ type: currentType, len: runLen });

  while (runs.length && runs[0].type === 'gap') runs.shift();
  while (runs.length && runs[runs.length - 1].type === 'gap') runs.pop();
  if (!runs.length) return { morse: '', confidence: 0 };

  const marks = runs.filter((r) => r.type === 'mark').map((r) => r.len);
  const gaps = runs.filter((r) => r.type === 'gap').map((r) => r.len);
  const { lowMean: dotLen, threshold: markThreshold, confidence } = splitTwo(marks);
  const gapThresholds = splitGaps(gaps, dotLen);

  let out = '';
  for (const run of runs) {
    if (run.type === 'mark') {
      out += run.len < markThreshold ? '.' : '-';
    } else if (run.len >= gapThresholds.large) {
      out += ' / ';
    } else if (run.len >= gapThresholds.small) {
      out += ' ';
    }
  }

  return {
    morse: out.replace(/\s+\/\s+/g, ' / ').replace(/\s{2,}/g, ' ').trim(),
    confidence,
  };
}

function morseToSequence(morse: string, unit: number) {
  const sequence: Array<{ type: 'on' | 'off'; dur: number }> = [];
  for (const char of morse) {
    if (char === '.') {
      sequence.push({ type: 'on', dur: unit }, { type: 'off', dur: unit });
    } else if (char === '-') {
      sequence.push({ type: 'on', dur: unit * 3 }, { type: 'off', dur: unit });
    } else if (char === ' ') {
      sequence.push({ type: 'off', dur: unit * 2 });
    } else if (char === '/') {
      sequence.push({ type: 'off', dur: unit * 6 });
    }
  }
  return sequence;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MorseImageTranslator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopFlagRef = useRef(false);

  const [dragActive, setDragActive] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [threshold, setThreshold] = useState(128);
  const [invert, setInvert] = useState(false);
  const [morse, setMorse] = useState('');
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [hintTone, setHintTone] = useState<HintTone>('muted');
  const [audioVisible, setAudioVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(15);
  const [pitch, setPitch] = useState(600);
  const [copyState, setCopyState] = useState<'text' | 'morse' | null>(null);

  const hintColor = useMemo(() => {
    if (hintTone === 'good') return 'var(--mcw-good)';
    if (hintTone === 'bad') return 'var(--mcw-bad)';
    return 'var(--mcw-muted)';
  }, [hintTone]);

  useEffect(() => () => {
    stopFlagRef.current = true;
    setIsPlaying(false);
  }, []);

  function stopAudio() {
    stopFlagRef.current = true;
    setIsPlaying(false);
  }

  function resetAll() {
    stopAudio();
    imageRef.current = null;
    setHasImage(false);
    setMorse('');
    setText('');
    setHint('');
    setAudioVisible(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function decodeCurrentImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const bin = new Uint8Array(width * height);

    for (let i = 0; i < width * height; i += 1) {
      const gray = imgData[i * 4] * 0.299 + imgData[i * 4 + 1] * 0.587 + imgData[i * 4 + 2] * 0.114;
      let ink = gray < threshold;
      if (invert) ink = !ink;
      bin[i] = ink ? 1 : 0;
    }

    const rowCounts = new Int32Array(height);
    for (let y = 0; y < height; y += 1) {
      let count = 0;
      for (let x = 0; x < width; x += 1) {
        if (bin[y * width + x]) count += 1;
      }
      rowCounts[y] = count;
    }

    const lineRegions = findRegions(rowCounts, Math.max(2, width * 0.005));
    if (!lineRegions.length) {
      setMorse('');
      setText('');
      setHint('No marks detected. Try adjusting the threshold slider or toggling invert.');
      setHintTone('bad');
      return;
    }

    const lines: string[] = [];
    let totalConfidence = 0;
    for (const region of lineRegions) {
      const { morse: decoded, confidence } = decodeRegion(bin, width, region.start, region.end);
      if (decoded) lines.push(decoded);
      totalConfidence += confidence;
    }

    const avgConfidence = totalConfidence / lineRegions.length;
    const nextMorse = lines.join(' / ').trim();
    const nextText = nextMorse ? morseToTextSafe(nextMorse) : '';

    setMorse(nextMorse);
    setText(nextText);

    if (avgConfidence > 0.7) {
      setHint(`Detected ${lineRegions.length} line${lineRegions.length > 1 ? 's' : ''} of Morse · decoding looks confident.`);
      setHintTone('good');
    } else if (avgConfidence > 0.4) {
      setHint('Detection is a bit ambiguous — try adjusting the threshold slider.');
      setHintTone('muted');
    } else {
      setHint('Low confidence. Works best on clean, high-contrast Morse. Try the threshold slider or invert toggle.');
      setHintTone('bad');
    }
  }

  function drawAndDecode(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scale = Math.min(1, 1200 / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setHasImage(true);
    decodeCurrentImage();
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setHint('Please upload an image file.');
      setHintTone('bad');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        drawAndDecode(img);
      };
      img.onerror = () => {
        setHint('Could not load image.');
        setHintTone('bad');
      };
      img.src = String(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  }

  async function playMorse() {
    if (!morse || isPlaying) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new window.AudioContext();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    stopFlagRef.current = false;
    setAudioVisible(true);
    setIsPlaying(true);
    const unit = 1.2 / wpm;
    const sequence = morseToSequence(morse, unit);

    for (const step of sequence) {
      if (stopFlagRef.current) break;
      if (step.type === 'on') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const now = audioCtx.currentTime;
        osc.type = 'sine';
        osc.frequency.value = pitch;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
        gain.gain.setValueAtTime(0.3, now + step.dur - 0.005);
        gain.gain.linearRampToValueAtTime(0, now + step.dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(now + step.dur);
      }
      await new Promise((resolve) => window.setTimeout(resolve, step.dur * 1000));
    }

    stopAudio();
  }

  async function copyValue(kind: 'text' | 'morse', value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopyState(kind);
    window.setTimeout(() => setCopyState(null), 1400);
  }

  function downloadText() {
    if (!morse) return;
    const content = `Image Morse Code Translator — Results\n=====================================\n\nDetected Morse:\n${morse}\n\nDecoded Text:\n${text}\n`;
    downloadBlob(new Blob([content], { type: 'text/plain' }), 'morse-decoded.txt');
  }

  function downloadWav() {
    if (!morse) return;
    const sampleRate = 44100;
    const unit = 1.2 / wpm;
    const sequence = morseToSequence(morse, unit);
    const totalSec = sequence.reduce((sum, step) => sum + step.dur, 0) + 0.2;
    const totalSamples = Math.ceil(totalSec * sampleRate);
    const samples = new Float32Array(totalSamples);

    let cursor = 0;
    for (const step of sequence) {
      const n = Math.round(step.dur * sampleRate);
      if (step.type === 'on') {
        for (let i = 0; i < n; i += 1) {
          let env = 0.3;
          const fade = Math.min(220, n / 4);
          if (i < fade) env *= i / fade;
          else if (i > n - fade) env *= (n - i) / fade;
          samples[cursor + i] = Math.sin(2 * Math.PI * pitch * (i / sampleRate)) * env;
        }
      }
      cursor += n;
    }

    downloadBlob(new Blob([encodeWav(samples, sampleRate)], { type: 'audio/wav' }), 'morse-audio.wav');
  }

  useEffect(() => {
    if (imageRef.current && hasImage) decodeCurrentImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, invert]);

  return (
    <div className="mcw-root">
      <div className="mcw-card">
        <header className="mcw-head">
          <div className="mcw-dotline" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span />
          </div>
        </header>

        <label
          className={`mcw-drop${dragActive ? ' mcw-drag' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) loadFile(file);
          }}
        >
          <input type="file" accept="image/*" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
          }} />
          <div className="mcw-drop-inner">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div><strong>Drop an image here</strong> or click to upload</div>
            <small>PNG, JPG, WebP — works best on clean, high-contrast Morse</small>
          </div>
        </label>

        <canvas ref={canvasRef} className="mcw-canvas" style={{ display: hasImage ? 'block' : 'none' }} />

        <div className="mcw-controls" style={{ display: hasImage ? 'flex' : 'none' }}>
          <label className="mcw-slider">
            <span>Threshold</span>
            <input type="range" min="20" max="230" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
            <output>{threshold}</output>
          </label>

          <label className="mcw-check">
            <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
            <span>Invert</span>
          </label>

          <button className="mcw-btn mcw-btn-ghost" type="button" onClick={resetAll}>Upload another</button>
        </div>

        <div className="mcw-result" style={{ display: hasImage ? 'grid' : 'none' }}>
          <div className="mcw-result-block">
            <div className="mcw-result-label"><span>Detected Morse</span></div>
            <div className="mcw-morse-out">{morse || '—'}</div>
          </div>

          <div className="mcw-result-block">
            <div className="mcw-result-label"><span>Decoded text</span></div>
            <div className="mcw-text-out">{text || '—'}</div>
          </div>

          <div className="mcw-actions">
            <button className={`mcw-action${isPlaying ? ' mcw-playing' : ''}`} type="button" onClick={() => (isPlaying ? stopAudio() : playMorse())}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                {isPlaying ? <rect x="6" y="6" width="12" height="12" /> : <path d="M8 5v14l11-7z" />}
              </svg>
              <span>{isPlaying ? 'Stop' : 'Listen'}</span>
            </button>

            <div className="mcw-action-group">
              <button className="mcw-action" type="button" title="Download as text file" onClick={downloadText}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                <span>Text file</span>
              </button>
              <button className="mcw-action" type="button" title="Download Morse audio" onClick={downloadWav}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 12h3l3-8 4 16 3-8h5" /></svg>
                <span>WAV audio</span>
              </button>
            </div>

            <div className="mcw-action-group">
              <button className={`mcw-action${copyState === 'text' ? ' mcw-done' : ''}`} type="button" onClick={() => copyValue('text', text)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                <span>{copyState === 'text' ? 'Copied ✓' : 'Copy text'}</span>
              </button>
              <button className={`mcw-action${copyState === 'morse' ? ' mcw-done' : ''}`} type="button" onClick={() => copyValue('morse', morse)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                <span>{copyState === 'morse' ? 'Copied ✓' : 'Copy Morse'}</span>
              </button>
            </div>
          </div>

          <div className={`mcw-audio-panel${audioVisible ? ' mcw-visible' : ''}`}>
            <div className={`mcw-lamp${isPlaying ? ' mcw-on' : ''}`} />
            <label className="mcw-slider mcw-slider-mini">
              <span>WPM</span>
              <input type="range" min="5" max="40" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} />
              <output>{wpm}</output>
            </label>
            <label className="mcw-slider mcw-slider-mini">
              <span>Pitch</span>
              <input type="range" min="300" max="900" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
              <output>{pitch} Hz</output>
            </label>
          </div>

          <p className="mcw-hint" style={{ color: hintColor }}>{hint}</p>
        </div>

        <footer className="mcw-foot">International Morse Code · 100% browser-based · your images are never uploaded</footer>
      </div>

      <style jsx>{`
        .mcw-root {
          --mcw-bg: #0a1530;
          --mcw-card: #0d1936;
          --mcw-surface: #111e44;
          --mcw-border: rgba(139, 156, 220, 0.18);
          --mcw-text: #ffffff;
          --mcw-muted: #8b9ad8;
          --mcw-muted-2: #5d6ea5;
          --mcw-g-start: #4f7dff;
          --mcw-g-end: #9f4cff;
          --mcw-orange-start: #ff9a5c;
          --mcw-orange-end: #ff5e5e;
          --mcw-accent: #8ea9ff;
          --mcw-good: #4ade80;
          --mcw-bad: #ff7b7b;
          --mcw-font: "Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          --mcw-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          color: var(--mcw-text);
          font-family: var(--mcw-font);
          line-height: 1.5;
          width: 100%;
          margin: 0;
        }
        .mcw-root :global(*) { box-sizing: border-box; }
        .mcw-card {
          background: radial-gradient(ellipse 80% 60% at 80% 0%, rgba(159, 76, 255, 0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(79, 125, 255, 0.08), transparent 60%), linear-gradient(180deg, var(--mcw-card) 0%, var(--mcw-bg) 100%);
          border: 1px solid var(--mcw-border);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .mcw-head { margin-bottom: 22px; }
        .mcw-dotline { display: flex; gap: 6px; margin-bottom: 14px; }
        .mcw-dotline span { display: block; height: 3px; background: var(--mcw-muted); border-radius: 2px; opacity: .35; }
        .mcw-dotline span:nth-child(1), .mcw-dotline span:nth-child(3), .mcw-dotline span:nth-child(4), .mcw-dotline span:nth-child(8) { width: 6px; }
        .mcw-dotline span:nth-child(2), .mcw-dotline span:nth-child(5), .mcw-dotline span:nth-child(6), .mcw-dotline span:nth-child(7) { width: 18px; }
        .mcw-dotline span:nth-child(8) { opacity: 1; background: linear-gradient(135deg, var(--mcw-g-start), var(--mcw-g-end)); }
        .mcw-drop {
          display: block;
          background: var(--mcw-surface);
          border: 1.5px dashed var(--mcw-border);
          border-radius: 12px;
          padding: 48px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color .15s, background .15s;
          position: relative;
          overflow: hidden;
        }
        .mcw-drop::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(79, 125, 255, .06), rgba(159, 76, 255, .06));
          opacity: 0;
          transition: opacity .15s;
          pointer-events: none;
        }
        .mcw-drop:hover, .mcw-drag { border-color: var(--mcw-g-start); }
        .mcw-drop:hover::before, .mcw-drag::before { opacity: 1; }
        .mcw-drop-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--mcw-muted); position: relative; }
        .mcw-drop-inner strong { color: #fff; font-weight: 600; }
        .mcw-drop-inner small { font-size: .82rem; color: var(--mcw-muted-2); font-family: var(--mcw-mono); }
        .mcw-drop svg { color: var(--mcw-accent); filter: drop-shadow(0 2px 8px rgba(79, 125, 255, .3)); }
        .mcw-canvas { max-width: 100%; border-radius: 10px; border: 1px solid var(--mcw-border); margin-top: 16px; background: #fff; }
        .mcw-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 14px 20px;
          align-items: center;
          margin-top: 16px;
          padding: 14px 16px;
          background: var(--mcw-surface);
          border: 1px solid var(--mcw-border);
          border-radius: 12px;
        }
        .mcw-slider, .mcw-check { display: flex; align-items: center; gap: 10px; font-size: .88rem; color: var(--mcw-muted); font-weight: 500; }
        .mcw-slider input[type='range'] { accent-color: var(--mcw-g-start); min-width: 140px; }
        .mcw-slider output { color: #fff; font-family: var(--mcw-mono); font-size: .84rem; font-weight: 500; min-width: 42px; }
        .mcw-slider-mini input[type='range'] { min-width: 90px; }
        .mcw-check { cursor: pointer; gap: 8px; }
        .mcw-check input { accent-color: var(--mcw-g-start); }
        .mcw-btn, .mcw-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: var(--mcw-font);
          font-weight: 600;
          cursor: pointer;
          transition: transform .1s, filter .15s, box-shadow .15s;
        }
        .mcw-btn {
          background: linear-gradient(135deg, var(--mcw-g-start) 0%, var(--mcw-g-end) 100%);
          padding: 10px 18px;
          font-size: .9rem;
          box-shadow: 0 4px 14px rgba(79, 125, 255, .25), inset 0 1px 0 rgba(255, 255, 255, .15);
          margin-left: auto;
        }
        .mcw-btn-ghost { background: linear-gradient(135deg, var(--mcw-orange-start) 0%, var(--mcw-orange-end) 100%); box-shadow: 0 4px 14px rgba(255, 110, 94, .3), inset 0 1px 0 rgba(255, 255, 255, .2); }
        .mcw-btn:hover, .mcw-action:hover { filter: brightness(1.08); }
        .mcw-btn:active, .mcw-action:active { transform: translateY(1px); }
        .mcw-result { margin-top: 20px; display: grid; gap: 14px; }
        .mcw-result-block { background: var(--mcw-surface); border: 1px solid var(--mcw-border); border-radius: 12px; padding: 16px; }
        .mcw-result-label { font-size: .76rem; text-transform: uppercase; letter-spacing: .09em; color: var(--mcw-muted); margin-bottom: 10px; font-weight: 600; }
        .mcw-morse-out { font-family: var(--mcw-mono); font-size: 1.2rem; letter-spacing: .1em; word-break: break-all; min-height: 1.5em; line-height: 1.6; color: var(--mcw-accent); }
        .mcw-text-out { font-size: 1.15rem; min-height: 1.5em; font-weight: 600; word-break: break-word; letter-spacing: -.01em; color: #fff; }
        .mcw-actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0; }
        .mcw-action-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .mcw-action {
          background: linear-gradient(135deg, var(--mcw-g-start) 0%, var(--mcw-g-end) 100%);
          padding: 9px 16px;
          font-size: .88rem;
          box-shadow: 0 3px 10px rgba(79, 125, 255, .2), inset 0 1px 0 rgba(255, 255, 255, .12);
        }
        .mcw-playing { background: linear-gradient(135deg, var(--mcw-orange-start) 0%, var(--mcw-orange-end) 100%); }
        .mcw-done { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); }
        .mcw-audio-panel {
          display: none;
          align-items: center;
          gap: 14px 20px;
          flex-wrap: wrap;
          padding: 12px 16px;
          background: var(--mcw-surface);
          border: 1px solid var(--mcw-border);
          border-radius: 12px;
        }
        .mcw-visible { display: flex; }
        .mcw-lamp { width: 14px; height: 14px; border-radius: 50%; background: rgba(139, 156, 220, .15); border: 1.5px solid var(--mcw-border); transition: background .04s, box-shadow .04s, border-color .04s; flex-shrink: 0; }
        .mcw-on { background: linear-gradient(135deg, var(--mcw-g-start), var(--mcw-g-end)); border-color: transparent; box-shadow: 0 0 14px rgba(79, 125, 255, .6); }
        .mcw-hint { margin: 0; font-size: .85rem; padding: 0 4px; font-weight: 500; }
        .mcw-foot { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--mcw-border); font-size: .78rem; color: var(--mcw-muted-2); text-align: center; }
        @media (max-width: 560px) {
          .mcw-card { padding: 20px; }
          .mcw-title { font-size: 1.3rem; }
          .mcw-morse-out { font-size: 1rem; }
          .mcw-btn { margin-left: 0; width: 100%; margin-top: 6px; }
          .mcw-slider input[type='range'] { min-width: 100px; }
          .mcw-action { flex: 1; justify-content: center; min-width: 0; }
          .mcw-action-group { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
}