'use client';

import { useParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global { interface Window { JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { dispose: () => void }; } }

export default function MeetingPage() {
  const { slug } = useParams<{ slug: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || !window.JitsiMeetExternalAPI || !containerRef.current) return;
    apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', { roomName: slug, parentNode: containerRef.current, width: '100%', height: 600 });
    return () => { apiRef.current?.dispose(); apiRef.current = null; };
  }, [loaded, slug]);

  return <div className="space-y-4 p-6"><Script src="https://meet.jit.si/external_api.js" onLoad={() => setLoaded(true)} /><h1 className="text-2xl font-bold">UnivAI Live Meeting</h1>{!loaded ? <p>Loading secure classroom...</p> : null}<div id="jitsi-container" ref={containerRef} className="overflow-hidden rounded-xl border bg-muted" /></div>;
}
