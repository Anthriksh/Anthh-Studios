"use client";

import { useEffect, useMemo, useState } from "react";

function trackView() {
  try {
    let sessionId = localStorage.getItem("anthriksh_session");
    if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem("anthriksh_session", sessionId); }
    const key = `anthriksh_view_${location.pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      sessionId, path: location.pathname, referrer: document.referrer, device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop", screen: `${screen.width}x${screen.height}`, language: navigator.language
    }) }).catch(() => {});
  } catch {}
}

function Media({ item, className = "" }) {
  const src = item?.url || item?.image;
  if (!src) return null;
  if (item.mediaType === "VIDEO" || item.kind === "VIDEO") return <video className={className} src={src} controls playsInline preload="metadata" />;
  return <img className={className} src={src} alt={item.alt || item.title || "Anthh archive"} />;
}

export default function Home() {
  const [content, setContent] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' }).then(r => r.json()).then(setContent).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll); onScroll(); trackView();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const artist = content?.artist || { name:'ANTHH', roles:'ARTIST · GUITARIST · SINGER · SONGWRITER', tagline:"WHAT I COULDN'T SAY.", bio:'Some things are easier to play than explain.' };
  const guitars = content?.guitars || [];
  const archive = content?.archive || [];
  const music = content?.music || [];
  const current = content?.currently || {};
  const featured = useMemo(() => archive.filter(x => x.featured !== false), [archive]);

  if (!content) return <div className="loadingScreen"><span>ANTHH</span><i>LOADING THE ARCHIVE</i></div>;

  return <main>
    <header className={`nav ${scrolled ? 'navSolid' : ''}`}>
      <a className="wordmark" href="#top">{artist.name}</a>
      <nav>{[['Story','story'],['About','about'],['Music','music'],['Guitars','guitars'],['Archive','archive'],['Media','media'],['Journal','journal']].map(([x,id])=><a key={id} href={id === 'media' ? '/media' : `#${id}`}>{x}</a>)}<a className="adminLink" href="/admin">Admin</a></nav>
      <div className="navActions"><a className="adminButton" href="/admin">ADMIN</a><button className="menuButton" onClick={() => setMenu(v=>!v)}>{menu ? 'CLOSE' : 'MENU'}</button></div>
    </header>
    {menu && <div className="mobileNav">{[['Story','story'],['About','about'],['Music','music'],['Guitars','guitars'],['Archive','archive'],['Media','media'],['Journal','journal']].map(([x,id])=><a key={id} href={id === 'media' ? '/media' : `#${id}`} onClick={()=>setMenu(false)}>{x}</a>)}<a href="/admin">Admin</a></div>}

    <section id="top" className="hero">
      <img className="heroImage" src={artist.heroImage || '/images/hero.png'} alt={`${artist.name} with guitar`} />
      <div className="heroShade" />
      <div className="heroMeta">{artist.roles}</div>
      <div className="heroTitle"><span>WHAT I</span><span>COULDN'T</span><span>SAY.</span></div>
      <div className="heroSide"><strong>01 / 06</strong><span>ARTIST ARCHIVE</span></div>
      <a className="scrollCue" href="#story">ENTER THE ARCHIVE <b>↓</b></a>
    </section>

    <section id="story" className="story section">
      <div className="eyebrow">01 / STORY</div>
      <div className="storyGrid"><div><h2>I found another way<br/>to say it.</h2></div><div className="storyCopy"><p>{artist.bio}</p>{artist.about && <p>{artist.about}</p>}<p>This is a living archive — music, instruments, photographs, experiments and the moments between them.</p></div></div>
      <div className="editorialImageWrap"><img className="storyImage" src={artist.storyImage || '/images/acoustic.png'} alt="Anthh with an acoustic guitar"/><span className="imageCaption">ROOFTOP / LATE AFTERNOON</span></div>
    </section>

    <section id="music" className="dark section">
      <div className="eyebrow">02 / MUSIC</div><div className="musicHead"><h2>The things<br/>I put into sound.</h2><p>{artist.musicIntro || 'Originals, covers, demos and late-night ideas.'}</p></div>
      {music.length ? music.map((x,i)=><div className="track" key={x.id || i}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{x.title || 'UNTITLED'}</strong>{x.description && <small>{x.description}</small>}</div><span className="trackType">{x.type || 'TRACK'}</span>{x.audio ? <audio controls src={x.audio} onPlay={()=>setPlaying(x.id)} /> : <button className="playDot" aria-label="No audio available">{playing===x.id?'Ⅱ':'＋'}</button>}</div>) : <div className="emptyLine">The first release is on its way.</div>}
    </section>

    <section id="guitars" className="gear section">
      <div className="eyebrow">03 / GUITARS</div><div className="gearGrid"><div><h2>Six strings.<br/>Many stories.</h2><p>{artist.guitarsIntro || 'Every instrument leaves a little of itself in the music.'}</p></div>{guitars[0]?.image && <img src={guitars[0].image} alt={guitars[0].name}/>}</div>
      <div className="gearList">{guitars.map((g,i)=><article className="gearCard" key={g.id||i}><span>{g.type}</span><h3>{g.name}</h3><p>{g.description}</p>{g.specs && <p className="specs">{g.specs}</p>}</article>)}</div>
    </section>

    <section id="archive" className="archive section"><div className="eyebrow">04 / ARCHIVE</div><h2>Moments worth keeping.</h2>{featured.length ? featured.map((x,i)=><article className="archiveGrid" key={x.id||i}><div className="archiveMedia"><Media item={x} /></div><div className="archiveNote"><span>{x.type || 'RECENT'}</span><h3>{x.title}</h3><p>{x.description}</p>{x.date && <small>{x.date}</small>}</div></article>) : <div className="emptyLine">The archive is waiting for its next chapter.</div>}</section>

    <section id="journal" className="dark journal section"><div className="eyebrow">05 / CURRENTLY</div><h2>Still becoming.</h2><div className="currently">{[['PLAYING',current.playing],['LISTENING TO',current.listeningTo],['WRITING',current.writing],['RECORDING',current.recording]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v||'—'}</strong></div>)}</div></section>

    <footer><div className="footerTitle">{artist.name}</div><p>{artist.tagline}</p><div className="footerLinks"><a href="#top">Back to top ↑</a><div><a href="/media">Media</a> {artist.instagram && <a href={artist.instagram} target="_blank" rel="noreferrer">Instagram</a>} {artist.youtube && <a href={artist.youtube} target="_blank" rel="noreferrer">YouTube</a>} {artist.spotify && <a href={artist.spotify} target="_blank" rel="noreferrer">Spotify</a>}</div><span>© {new Date().getFullYear()}</span></div></footer>
  </main>;
}
