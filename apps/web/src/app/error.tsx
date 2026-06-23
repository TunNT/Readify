"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="statusPage"><p>Error</p><h1>We couldn’t load this page</h1><span>Please check that the API is running and try again.</span><button className="primaryButton" onClick={reset}>Try Again</button></main>; }
