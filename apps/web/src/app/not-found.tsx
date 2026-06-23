import Link from "next/link";
export default function NotFound() { return <main className="statusPage"><p>404</p><h1>Page not found</h1><span>The story or page you requested is not available.</span><Link className="primaryButton" href="/">Return Home</Link></main>; }
