'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { morseToText, textToMorse } from '@/lib/morse';

const SAMPLE_PHRASES = [
  'HELLO WORLD',
  'SOS',
  'I LOVE YOU',
  'GOOD MORNING',
  'MORSE CODE IS FUN',
  'HI THERE',
  'HELP ME',
  'YES NO MAYBE',
];

export default function MorseTranslator() {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [direction, setDirection] = useState<'t2m' | 'm2t'>('t2m');

  // Audio + light state
  const [pitch, setPitch] = useState(550);
  const [volume, setVolume] = useState(80);
  const [wpm, setWpm] = useState(20);
  const [farns, setFarns] = useState(15);
  const [showSep, setShowSep] = useState(true);
  const [tone, setTone] = useState<'cw' | 'telegraph'>('cw');
  const [showConfig, setShowConfig] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lightEnabled, setLightEnabled] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopFlagRef = useRef(false);
  const repeatRef = useRef(false);

  // Live conversion
  useEffect(() => {
    if (direction === 't2m') {
      setMorse(textToMorse(text, showSep ? ' / ' : '   '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, showSep, direction]);

  useEffect(() => {
    if (direction === 'm2t') {
      setText(morseToText(morse));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morse, direction]);

  function handleSwap() {
    setDirection((d) => (d === 't2m' ? 'm2t' : 't2m'));
  }

  function ensureCtx(): AudioContext {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  }

  function buildPlan() {
    const dot = 1.2 / wpm;
    const farnsDot = farns < wpm ? 1.2 / farns : dot;
    const dash = dot * 3;
    const intra = dot;
    const interLetter = farnsDot * 3;
    const interWord = farnsDot * 7;

    const events: Array<{ start: number; dur: number }> = [];
    let t = 0.05;

    const words = morse.split(/\s*\/\s*/);
    for (let wi = 0; wi < words.length; wi++) {
      const letters = words[wi].trim().split(/\s+/).filter(Boolean);
      for (let li = 0; li < letters.length; li++) {
        const sigs = letters[li].split('');
        for (let si = 0; si < sigs.length; si++) {
          const dur = sigs[si] === '-' ? dash : dot;
          events.push({ start: t, dur });
          t += dur;
          if (si < sigs.length - 1) t += intra;
        }
        if (li < letters.length - 1) t += interLetter;
      }
      if (wi < words.length - 1) t += interWord;
    }

    return { events, total: t + 0.1 };
  }

  async function playMorse() {
    if (!morse.trim()) return;
    const ctx = ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    setPlaying(true);
    stopFlagRef.current = false;
    const { events, total } = buildPlan();
    const baseTime = ctx.currentTime;

    const beep = (start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = pitch;
      osc.type = tone === 'cw' ? 'sine' : 'square';
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume / 100, start + 0.005);
      gain.gain.setValueAtTime(volume / 100, start + dur - 0.005);
      gain.gain.linearRampToValueAtTime(0, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    };

    for (const event of events) {
      if (soundEnabled) beep(baseTime + event.start, event.dur);
    }

    // schedule light flashes via setTimeout based on AudioContext clock
    if (lightEnabled) {
      for (const { start, dur } of events) {
        const onMs = start * 1000;
        const offMs = onMs + dur * 1000;
        setTimeout(() => !stopFlagRef.current && setLightOn(true), onMs);
        setTimeout(() => !stopFlagRef.current && setLightOn(false), offMs);
      }
    }
    const totalMs = total * 1000;
    setTimeout(() => {
      setLightOn(false);
      setPlaying(false);
      if (repeatRef.current && !stopFlagRef.current) playMorse();
    }, totalMs + 100);
  }

  function stop() {
    stopFlagRef.current = true;
    repeatRef.current = false;
    setPlaying(false);
    setLightOn(false);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  function toggleRepeat() {
    repeatRef.current = !repeatRef.current;
    if (repeatRef.current && !playing) playMorse();
  }

  function copy(value: string) {
    if (navigator.clipboard) navigator.clipboard.writeText(value);
  }

  function share() {
    const data = {
      title: 'Morse Code Translation',
      text: `Text: ${text}\nMorse: ${morse}`,
      url: 'https://morse-codetranslator.com/',
    };
    if (navigator.share) {
      navigator.share(data).catch(() => {});
    } else {
      copy(`${data.text}\n${data.url}`);
      alert('Copied translation to clipboard!');
    }
  }

  function random() {
    const phrase = SAMPLE_PHRASES[Math.floor(Math.random() * SAMPLE_PHRASES.length)];
    setDirection('t2m');
    setText(phrase);
  }

  const charCount = text.length;
  const signalCount = useMemo(() => morse.replace(/[^.\-]/g, '').length, [morse]);

  async function downloadMp3() {
    if (!morse.trim() || downloading) return;
    setDownloading(true);
    try {
      const { Mp3Encoder } = await import('lamejs');
      const { events, total } = buildPlan();
      const sampleRate = 44100;
      const frameCount = Math.ceil(total * sampleRate);
      const ctx = new OfflineAudioContext(1, frameCount, sampleRate);

      for (const event of events) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = pitch;
        osc.type = tone === 'cw' ? 'sine' : 'square';
        gain.gain.setValueAtTime(0, event.start);
        gain.gain.linearRampToValueAtTime(volume / 100, event.start + 0.005);
        gain.gain.setValueAtTime(volume / 100, Math.max(event.start + event.dur - 0.005, event.start + 0.005));
        gain.gain.linearRampToValueAtTime(0, event.start + event.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(event.start);
        osc.stop(event.start + event.dur + 0.02);
      }

      const rendered = await ctx.startRendering();
      const samples = rendered.getChannelData(0);
      const int16 = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      const encoder = new Mp3Encoder(1, sampleRate, 128);
      const chunks: Uint8Array[] = [];
      const blockSize = 1152;
      for (let i = 0; i < int16.length; i += blockSize) {
        const chunk = int16.subarray(i, i + blockSize);
        const mp3buf = encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) chunks.push(new Uint8Array(mp3buf));
      }
      const end = encoder.flush();
      if (end.length > 0) chunks.push(new Uint8Array(end));

      const blob = new Blob(
        chunks.map((chunk) => Uint8Array.from(chunk).buffer as ArrayBuffer),
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'morse-code.mp3';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-[26px] border border-[#13214f] bg-[linear-gradient(180deg,#0c1538_0%,#0a122f_100%)] text-white shadow-[0_24px_60px_-24px_rgba(11,20,55,0.58)] p-4 md:p-6 ring-1 ring-white/5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start md:gap-5 lg:gap-6">
        {/* Text panel */}
        <div className="min-w-0 flex flex-col">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-white/95">Text</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setDirection('t2m'); setText(e.target.value); }}
            placeholder="Enter text…"
            rows={6}
            className="min-h-[12.75rem] w-full resize-none rounded-2xl border border-[#23356f] bg-[#0f1b46] p-4 text-base leading-relaxed text-white outline-none transition focus:border-[#6b7dff] focus:ring-2 focus:ring-[#6b7dff]/30 placeholder:text-[#7f90c8]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap gap-2">
              <button onClick={random} className="tx-btn">Random</button>
              <button onClick={() => copy(text)} className="tx-btn">Copy</button>
            </div>
            <div className="text-xs text-[#9ba9dd]">{charCount} chars</div>
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center -my-1 md:my-0 md:self-center md:row-start-1 md:col-start-2">
          <button
            onClick={handleSwap}
            title="Swap direction"
            className="h-11 w-11 rounded-full bg-[linear-gradient(135deg,#ff8a3d_0%,#ff5f7a_100%)] text-lg text-white shadow-[0_12px_24px_-8px_rgba(255,95,122,0.65)] ring-4 ring-[#0a122f] transition hover:-translate-y-0.5 hover:brightness-110"
          >⇆</button>
        </div>

        {/* Morse panel */}
        <div className="min-w-0 flex flex-col md:col-start-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-white/95">Morse Code</span>
          </div>
          <textarea
            value={morse}
            onChange={(e) => { setDirection('m2t'); setMorse(e.target.value); }}
            placeholder="Morse output…"
            rows={6}
            className="min-h-[12.75rem] w-full resize-none rounded-2xl border border-[#23356f] bg-[#0f1b46] p-4 font-mono text-base leading-relaxed tracking-wider text-white outline-none transition focus:border-[#6b7dff] focus:ring-2 focus:ring-[#6b7dff]/30 placeholder:text-[#7f90c8]"
          />
          <div className="mt-3 flex flex-wrap gap-2 px-1">
            <button onClick={playMorse} disabled={playing || !morse.trim()} className="tx-btn-primary">Play</button>
            <button onClick={stop} className="tx-btn">Stop</button>
            <button onClick={toggleRepeat} className="tx-btn">Repeat</button>
            <button onClick={() => setSoundEnabled((v) => !v)} className={`tx-btn ${soundEnabled ? 'tx-btn-active' : ''}`}>Sound</button>
            <button onClick={() => setLightEnabled((v) => !v)} className={`tx-btn ${lightEnabled ? 'tx-btn-active' : ''}`}>Light</button>
            <button onClick={() => setShowConfig((v) => !v)} className={`tx-btn ${showConfig ? 'tx-btn-active' : ''}`}>Configure</button>
            <button onClick={share} className="tx-btn">Share</button>
            <button onClick={() => copy(morse)} className="tx-btn">Copy</button>
            <button onClick={downloadMp3} disabled={downloading || !morse.trim()} className="tx-btn">MP3</button>
          </div>
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-[#9ba9dd]">
            <span>{signalCount} signals</span>
            <span
              className="inline-flex items-center gap-2"
              aria-label="Light indicator"
            >
              <span
                className={`inline-block h-3 w-3 rounded-full transition ${lightEnabled && lightOn ? 'bg-yellow-300 shadow-[0_0_18px_6px_rgba(253,224,71,0.7)]' : 'bg-[#7f90c8]/60'}`}
              />
              <span>Light</span>
            </span>
          </div>
        </div>
      </div>

      {showConfig && (
        <div className="mt-5 grid gap-4 rounded-2xl border border-[#22336a] bg-[#0f1b46] p-5 sm:grid-cols-2">
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-medium text-white">Sound type</span>
            <select value={tone} onChange={(e) => setTone(e.target.value as any)} className="rounded-xl border border-[#23356f] bg-[#0b1437] p-2 text-white outline-none focus:border-[#6b7dff]">
              <option value="cw">CW Radio Tone</option>
              <option value="telegraph">Telegraph sounder</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium mb-1 text-white">Pitch (Hz): {pitch}</span>
            <input type="range" min={300} max={1200} step={10} value={pitch} onChange={(e) => setPitch(+e.target.value)} />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium mb-1 text-white">Volume: {volume}</span>
            <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(+e.target.value)} />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium mb-1 text-white">Speed (WPM): {wpm}</span>
            <input type="range" min={5} max={40} value={wpm} onChange={(e) => setWpm(+e.target.value)} />
          </label>
          <label className="flex flex-col text-sm">
            <span className="font-medium mb-1 text-white">Farnsworth (WPM): {farns}</span>
            <input type="range" min={5} max={40} value={farns} onChange={(e) => setFarns(+e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={showSep} onChange={(e) => setShowSep(e.target.checked)} />
            Show word separator (/)
          </label>
        </div>
      )}
    </div>
  );
}
