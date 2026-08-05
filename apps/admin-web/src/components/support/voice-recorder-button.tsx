'use client';

import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoiceRecorderButton({
  disabled,
  onRecorded,
  recordingLabel,
  stopLabel,
}: {
  disabled?: boolean;
  onRecorded: (blob: Blob) => void;
  recordingLabel: string;
  stopLabel: string;
}) {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        onRecorded(blob);
        setRecording(false);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      className={recording ? 'border-red-400/50 text-red-300' : undefined}
      onClick={() => {
        if (recording) {
          mediaRef.current?.stop();
          mediaRef.current = null;
        } else void start();
      }}
    >
      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {recording ? stopLabel : recordingLabel}
    </Button>
  );
}
