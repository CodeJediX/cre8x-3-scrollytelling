"use client";

export default function ErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="system-state"><span className="platform-kicker">Signal interrupted</span><h1>The timeline fractured.</h1><p>A network or application error interrupted this view. Your saved data has not been intentionally changed.</p><button className="primary-action" onClick={reset}>Reopen signal</button></main>;
}
