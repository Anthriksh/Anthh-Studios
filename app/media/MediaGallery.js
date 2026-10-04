"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MediaGallery() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load the archive.");
        return r.json();
      })
      .then(setContent)
      .catch((e) => setError(e.message));
  }, []);

  const media = content?.media || [];

  return (
    <main className="publicMedia">
      <header className="mediaNav">
        <Link href="/" className="mediaWordmark">
          {content?.artist?.name || "ANTHH"}
        </Link>
        <nav>
          <Link href="/#story">STORY</Link>
          <Link href="/#music">MUSIC</Link>
          <Link href="/#guitars">GUITARS</Link>
          <Link href="/#archive">ARCHIVE</Link>
          <Link href="/media" aria-current="page">MEDIA</Link>
          <Link href="/admin">ADMIN</Link>
        </nav>
      </header>

      <section className="mediaHero">
        <span>06 / MEDIA</span>
        <h1>Everything<br /><em>in one place.</em></h1>
        <p>Published photographs, videos and sounds from the Anthh archive.</p>
      </section>

      {error && <div className="mediaError">{error}</div>}

      {!content ? (
        <div className="mediaLoading">LOADING THE MEDIA ARCHIVE</div>
      ) : media.length === 0 ? (
        <section className="mediaEmpty">
          <span>THE ARCHIVE IS QUIET.</span>
          <h2>Nothing has been published here yet.</h2>
          <p>Published media from Studio will appear on this page automatically.</p>
          <Link href="/admin">OPEN STUDIO →</Link>
        </section>
      ) : (
        <section className="mediaGrid">
          {media.map((item) => (
            <article className="mediaItem" key={item.url || item.name}>
              <div className="mediaVisual">
                {item.kind === "IMAGE" ? (
                  <img src={item.url} alt={item.name || "Anthh media"} />
                ) : item.kind === "VIDEO" ? (
                  <video src={item.url} controls playsInline preload="metadata" />
                ) : (
                  <div className="mediaAudio">
                    <span>AUDIO</span>
                    <h3>{item.name}</h3>
                    <audio src={item.url} controls />
                  </div>
                )}
              </div>
              <div className="mediaMeta">
                <span>{item.kind || "MEDIA"}</span>
                <h3>{item.name || "Untitled"}</h3>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
