"use client";

import { useEffect, useState } from "react";

export default function AboutPage() {
  const [content, setContent] = useState(null);
  useEffect(() => { fetch("/api/content", { cache: "no-store" }).then(r => r.json()).then(setContent).catch(() => {}); }, []);
  if (!content) return <main className="aboutPage"><div className="aboutLoading">ANTHH / ABOUT</div></main>;
  const a = content.artist || {};
  return <main className="aboutPage">
    <header className="aboutNav"><a href="/" className="aboutWordmark">{a.name || "ANTHH"}</a><nav><a href="/">ARCHIVE</a><a href="/about" className="active">ABOUT</a><a href="/media">MEDIA</a><a href="/admin">ADMIN</a></nav></header>

    <section className="aboutHero">
      <div className="aboutHeroMeta">ABOUT THE ARTIST / 01</div>
      <h1>Not just the<br/><em>music.</em><br/>The person behind it.</h1>
      <p className="aboutLead">A closer look at Anthh — the student, guitarist, singer and songwriter behind the archive.</p>
    </section>

    <section className="aboutIdentity">
      <div className="aboutLabel">WHO I AM</div>
      <div className="aboutIdentityGrid">
        <div><h2>{a.name || "ANTHH"}</h2><p className="aboutRoles">{a.roles || "ARTIST · GUITARIST · SINGER · SONGWRITER"}</p></div>
        <div className="aboutBody"><p>{a.bio || "Some things are easier to play than explain."}</p><p>{a.about || "I play guitar, sing, write songs and keep collecting the little moments that turn into music."}</p></div>
      </div>
    </section>

    <section className="aboutFacts">
      <div className="aboutLabel">THE PERSON BEHIND THE WORK</div>
      <div className="factsGrid">
        <Fact label="HOMETOWN" value={a.hometown || "Add my hometown in Studio → Content."} />
        <Fact label="BASED IN" value={a.basedIn || "India"} />
        <Fact label="STUDYING" value={a.education || "B.Tech — CSE (AI & ML)"} />
        <Fact label="ALONGSIDE IT" value={a.educationDetail || "Building a creative life alongside technology."} />
      </div>
    </section>

    <section className="aboutJourney">
      <div className="aboutLabel">THE JOURNEY</div>
      <div className="journeyGrid"><h2>Learning.<br/>Making.<br/><em>Becoming.</em></h2><div className="aboutBody"><p>{a.journey}</p><p>{a.future}</p></div></div>
    </section>

    <section className="aboutProfessional">
      <div className="aboutLabel">FOR PRODUCERS / ARTISTS / STUDIOS</div>
      <div className="professionalGrid"><h2>Looking for<br/><em>someone to build</em><br/>with?</h2><div><p className="professionalPitch">{a.producerPitch}</p><div className="skillList">{(a.skills || "Guitar · Vocals · Songwriting · Recording · Creative Direction").split("·").map((x,i)=><span key={i}>{x.trim()}</span>)}</div><div className="contactActions">{a.contactEmail && <a href={`mailto:${a.contactEmail}`}>CONTACT / EMAIL ↗</a>}{a.instagram && <a href={a.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>}{a.youtube && <a href={a.youtube} target="_blank" rel="noreferrer">YOUTUBE ↗</a>}</div></div></div>
    </section>

    <footer className="aboutFooter"><div>{a.name || "ANTHH"}</div><span>{a.tagline || "WHAT I COULDN'T SAY."}</span><a href="/">BACK TO ARCHIVE ↑</a></footer>
  </main>;
}
function Fact({ label, value }) { return <div className="fact"><span>{label}</span><strong>{value}</strong></div>; }
