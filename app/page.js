"use client";

import { useEffect, useMemo, useState } from "react";

function trackView() {
  try {
    let sessionId = localStorage.getItem("anthriksh_session");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("anthriksh_session", sessionId);
    }

    const key = `anthriksh_view_${location.pathname}`;

    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        path: location.pathname,
        referrer: document.referrer,
        device: /Mobi|Android/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        screen: `${screen.width}x${screen.height}`,
        language: navigator.language,
      }),
    }).catch(() => {});
  } catch {}
}

function Media({ item, className = "" }) {
  const src = item?.url || item?.image;

  if (!src) return null;

  if (
    item.mediaType === "VIDEO" ||
    item.kind === "VIDEO"
  ) {
    return (
      <video
        className={className}
        src={src}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={
        item.alt ||
        item.title ||
        "Anthriksh archive"
      }
    />
  );
}

export default function Home() {
  const [content, setContent] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    fetch("/api/content", {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then(setContent)
      .catch(() => {});

    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", onScroll);

    onScroll();
    trackView();

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  const artist =
    content?.artist || {
      name: "ANTHRIKSH",
      roles:
        "ARTIST · GUITARIST · SINGER · SONGWRITER",
      tagline: "WHAT I COULDN'T SAY.",
      bio: "Some things are easier to play than explain.",
    };

  const guitars = content?.guitars || [];
  const archive = content?.archive || [];
  const music = content?.music || [];
  const current = content?.currently || {};
  const media = content?.media || [];

  const featured = useMemo(
    () =>
      archive.filter(
        (x) => x.featured !== false
      ),
    [archive]
  );

  if (!content) {
    return (
      <div className="loadingScreen">
        <span>ANTHRIKSH</span>
        <i>LOADING THE ARCHIVE</i>
      </div>
    );
  }

  return (
    <main>

      {/* NAVIGATION */}

      <header
        className={`nav ${
          scrolled ? "navSolid" : ""
        }`}
      >
        <a
          className="wordmark"
          href="#top"
        >
          {artist.name}
        </a>

        <nav>
          {[
            ["Story", "story"],
            ["About", "about"],
            ["Music", "music"],
            ["Watch", "media"],
            ["Guitars", "guitars"],
            ["Journal", "journal"],
          ].map(([label, id]) => (
            <a
              key={id}
              href={
                id === "media"
                  ? "/media"
                  : `#${id}`
              }
            >
              {label}
            </a>
          ))}

          <a
            className="adminLink"
            href="/admin"
          >
            Admin
          </a>
        </nav>

        <div className="navActions">
          <a
            className="adminButton"
            href="/admin"
          >
            ADMIN
          </a>

          <button
            className="menuButton"
            onClick={() =>
              setMenu((value) => !value)
            }
          >
            {menu ? "CLOSE" : "MENU"}
          </button>
        </div>
      </header>

      {menu && (
        <div className="mobileNav">
          {[
            ["Story", "story"],
            ["About", "about"],
            ["Music", "music"],
            ["Watch", "media"],
            ["Guitars", "guitars"],
            ["Journal", "journal"],
          ].map(([label, id]) => (
            <a
              key={id}
              href={
                id === "media"
                  ? "/media"
                  : `#${id}`
              }
              onClick={() =>
                setMenu(false)
              }
            >
              {label}
            </a>
          ))}

          <a href="/admin">
            Admin
          </a>
        </div>
      )}

      {/* HERO */}

      <section
        id="top"
        className="hero"
      >
        <img
          className="heroImage"
          src={
            artist.heroImage ||
            "/images/hero.png"
          }
          alt={`${artist.name} with guitar`}
        />

        <div className="heroShade" />

        <div className="heroMeta">
          {artist.roles}
        </div>

        <div className="heroTitle">
          <span>WHAT I</span>
          <span>COULDN'T</span>
          <span>SAY.</span>
        </div>

        <div className="heroSide">
          <strong>01 / 06</strong>
          <span>ARTIST ARCHIVE</span>
        </div>

        <div className="heroCtas">
          <a
            className="heroWatch"
            href="/media"
          >
            WATCH THE LATEST{" "}
            <b>↗</b>
          </a>

          <a
            className="scrollCue"
            href="#story"
          >
            ENTER THE STORY{" "}
            <b>↓</b>
          </a>
        </div>
      </section>

      {/* LATEST / WATCH */}

      <section
        className="homeWatch section"
        id="watch"
      >
        <div className="eyebrow">
          LATEST / WATCH
        </div>

        <div className="homeWatchHead">
          <h2>
            See what
            <br />
            <em>I'm making.</em>
          </h2>

          <a href="/media">
            WATCH EVERYTHING ↗
          </a>
        </div>

        {media.length ? (
          <div className="homeLatest">
            {media
              .slice(0, 3)
              .map((item, index) => {
                const mediaId =
                  item.id ||
                  item.storagePath ||
                  item.url ||
                  item.name ||
                  "";

                return (
                  <a
                    className={`homeMediaCard ${
                      index === 0
                        ? "featured"
                        : ""
                    }`}
                    href={`/media#${encodeURIComponent(
                      mediaId
                    )}`}
                    key={
                      mediaId ||
                      index
                    }
                  >
                    <div className="homeMediaVisual">

                      {item.kind ===
                      "VIDEO" ? (
                        item.thumbnail ? (
                          <img
                            src={
                              item.thumbnail
                            }
                            alt={
                              item.name ||
                              "Latest Anthh work"
                            }
                          />
                        ) : (
                          <video
                            src={
                              item.url
                            }
                            muted
                            playsInline
                            preload="metadata"
                          />
                        )
                      ) : item.kind ===
                        "IMAGE" ? (
                        <img
                          src={
                            item.url
                          }
                          alt={
                            item.name ||
                            "Latest Anthh work"
                          }
                        />
                      ) : (
                        <div className="homeAudioCard">
                          <span>
                            AUDIO
                          </span>

                          <strong>
                            {item.name ||
                              "Untitled"}
                          </strong>
                        </div>
                      )}

                      <span className="homeMediaOverlay">
                        {item.kind ||
                          "MEDIA"}{" "}
                        →
                      </span>
                    </div>

                    <div>
                      <span>
                        {index === 0
                          ? "LATEST"
                          : item.kind ||
                            "MEDIA"}
                      </span>

                      <strong>
                        {item.name ||
                          "Untitled"}
                      </strong>

                      <b>
                        WATCH ↗
                      </b>
                    </div>
                  </a>
                );
              })}
          </div>
        ) : (
          <div className="emptyLine">
            The next piece is on its way.
          </div>
        )}
      </section>

      {/* STORY */}

      <section
        id="story"
        className="story section"
      >
        <div className="eyebrow">
          01 / STORY
        </div>

        <div className="storyGrid">
          <div>
            <h2>
              I found another way
              <br />
              to say it.
            </h2>
          </div>

          <div className="storyCopy">
            <p>
              {artist.bio}
            </p>

            {artist.about && (
              <p>
                {artist.about}
              </p>
            )}

            <p>
              This is a living archive —
              music, instruments,
              photographs, experiments
              and the moments between
              them.
            </p>
          </div>
        </div>

        <div className="editorialImageWrap">
          <img
            className="storyImage"
            src={
              artist.storyImage ||
              "/images/acoustic.png"
            }
            alt="Anthriksh with an acoustic guitar"
          />

          <span className="imageCaption">
            ROOFTOP / LATE AFTERNOON
          </span>
        </div>
      </section>

      {/* MUSIC */}

      <section
        id="music"
        className="dark section"
      >
        <div className="eyebrow">
          02 / MUSIC
        </div>

        <div className="musicHead">
          <h2>
            The things
            <br />
            I put into sound.
          </h2>

          <p>
            {artist.musicIntro ||
              "Originals, covers, demos and late-night ideas."}
          </p>
        </div>

        {music.length ? (
          music.map((track, index) => (
            <div
              className="track"
              key={
                track.id ||
                index
              }
            >
              <span>
                {String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <div>
                <strong>
                  {track.title ||
                    "UNTITLED"}
                </strong>

                {track.description && (
                  <small>
                    {
                      track.description
                    }
                  </small>
                )}
              </div>

              <span className="trackType">
                {track.type ||
                  "TRACK"}
              </span>

              {track.audio ? (
                <audio
                  controls
                  src={
                    track.audio
                  }
                  onPlay={() =>
                    setPlaying(
                      track.id
                    )
                  }
                />
              ) : (
                <button
                  className="playDot"
                  aria-label="No audio available"
                >
                  {playing ===
                  track.id
                    ? "Ⅱ"
                    : "＋"}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="emptyLine">
            The first release is on
            its way.
          </div>
        )}
      </section>

      {/* GUITARS — ORIGINAL LAYOUT */}

      <section
        id="guitars"
        className="gear section"
      >
        <div className="eyebrow">
          03 / GUITARS
        </div>

        <div className="gearGrid">

          <div>
            <h2>
              Six strings.
              <br />
              Many stories.
            </h2>

            <p>
              {artist.guitarsIntro ||
                "Every instrument leaves a little of itself in the music."}
            </p>
          </div>

          {guitars[0]?.image && (
            <img
              src={guitars[0].image}
              alt={guitars[0].name}
            />
          )}

        </div>

        <div className="gearList">
          {guitars.map(
            (guitar, index) => (
              <article
                className="gearCard"
                key={
                  guitar.id ||
                  index
                }
              >
                <span>
                  {guitar.type}
                </span>

                <h3>
                  {guitar.name}
                </h3>

                <p>
                  {
                    guitar.description
                  }
                </p>

                {guitar.specs && (
                  <p className="specs">
                    {
                      guitar.specs
                    }
                  </p>
                )}
              </article>
            )
          )}
        </div>
      </section>

      {/* ARCHIVE */}

      <section
        id="archive"
        className="archive section"
      >
        <div className="eyebrow">
          04 / ARCHIVE
        </div>

        <h2>
          Moments worth keeping.
        </h2>

        {featured.length ? (
          featured.map(
            (item, index) => (
              <article
                className="archiveGrid"
                key={
                  item.id ||
                  index
                }
              >
                <div className="archiveMedia">
                  <Media
                    item={item}
                  />
                </div>

                <div className="archiveNote">
                  <span>
                    {item.type ||
                      "RECENT"}
                  </span>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {
                      item.description
                    }
                  </p>

                  {item.date && (
                    <small>
                      {item.date}
                    </small>
                  )}
                </div>
              </article>
            )
          )
        ) : (
          <div className="emptyLine">
            The archive is waiting
            for its next chapter.
          </div>
        )}
      </section>

      {/* JOURNAL */}

      <section
        id="journal"
        className="dark journal section"
      >
        <div className="eyebrow">
          05 / CURRENTLY
        </div>

        <h2>
          Still becoming.
        </h2>

        <div className="currently">
          {[
            [
              "PLAYING",
              current.playing,
            ],
            [
              "LISTENING TO",
              current.listeningTo,
            ],
            [
              "WRITING",
              current.writing,
            ],
            [
              "RECORDING",
              current.recording,
            ],
          ].map(
            ([label, value]) => (
              <div
                key={label}
              >
                <span>
                  {label}
                </span>

                <strong>
                  {value || "—"}
                </strong>
              </div>
            )
          )}
        </div>
      </section>

      {/* FOOTER */}

      <footer>
        <div className="footerTitle">
          {artist.name}
        </div>

        <p>
          {artist.tagline}
        </p>

        <div className="footerLinks">
          <a href="#top">
            Back to top ↑
          </a>

          <div>
            <a href="/media">
              Watch
            </a>

            {artist.instagram && (
              <a
                href={
                  artist.instagram
                }
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            )}

            {artist.youtube && (
              <a
                href={
                  artist.youtube
                }
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
            )}

            {artist.spotify && (
              <a
                href={
                  artist.spotify
                }
                target="_blank"
                rel="noreferrer"
              >
                Spotify
              </a>
            )}
          </div>

          <span>
            ©{" "}
            {new Date().getFullYear()}
          </span>
        </div>
      </footer>

    </main>
  );
}