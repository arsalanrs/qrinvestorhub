'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

type DictationTextareaProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  rows?: number;
  placeholder?: string;
  style?: React.CSSProperties;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: { [index: number]: { transcript: string } };
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function DictationTextarea({
  value = '',
  onChange,
  onBlur,
  name,
  rows = 4,
  placeholder,
  style,
}: DictationTextareaProps) {
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i][0]?.transcript ?? '';
      }
      if (chunk.trim()) {
        const base = valueRef.current.trim();
        onChange(base ? `${base} ${chunk.trim()}` : chunk.trim());
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onChange]);

  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder}
          style={{ ...style, paddingRight: '44px' }}
        />
        <button
          type="button"
          onClick={() => (listening ? stopListening() : startListening())}
          title={listening ? 'Stop dictation' : 'Dictate here'}
          aria-label={listening ? 'Stop dictation' : 'Start dictation'}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            border: `1.5px solid ${listening ? 'var(--clay)' : 'var(--line)'}`,
            borderRadius: '4px',
            background: listening ? '#fef2f2' : '#fff',
            color: listening ? 'var(--clay)' : 'var(--slate)',
            cursor: speechSupported ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: speechSupported ? 1 : 0.5,
          }}
          disabled={!speechSupported}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--slate-light)', margin: '6px 0 0' }}>
        {speechSupported
          ? 'Tap the microphone to dictate. Chrome/Edge work best.'
          : 'Voice dictation: Windows — Win+H · Mac — Fn+Fn or Edit → Start Dictation'}
      </p>
    </div>
  );
}
