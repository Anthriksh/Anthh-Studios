"use client";

import { useEffect, useMemo, useState } from "react";

function trackView() {
  try {
    let sessionId = localStorage.getItem(
      "anthriksh_session"
    );

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      localStorage.setItem(
        "anthriksh_session",
        sessionId
      );
    }

    const key =
      `anthriksh_view_${location.pathname}`;

    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, "1");

    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        sessionId,
        path: location.pathname,
        referrer: document.referrer,
        device:
          /Mobi|Android/i.test(
            navigator.userAgent
          )
            ? "mobile"
            : "desktop",
        screen:
          `${screen.width}x${screen.height}`,
        language:
          navigator.language,
      }),
    }).catch(() => {});
  } catch {}
}

function Media({
  item,
  className = "",
}) {
  const src =
    item?.url || item?.image;

  if (!src) {
    return null;
  }

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
        poster={
          item.thumbnail ||
          item.poster ||
          undefined
        }
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

function formatPostDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

export default function Home() {
  const [content, setContent] =
    useState(null);

  const [scrolled, setScrolled] =
    useState(false);

  const [menu, setMenu] =
    useState(false);

  const [playing, setPlaying] =
    useState(null);

  useEffect(() => {
    fetch("/api/content", {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load content."
          );
        }

        return response.json();
      })
      .then(setContent)
      .catch(() => {});

    const onScroll = () => {
      setScrolled(
        window.scrollY > 60
      );
    };

    window.addEventListener(
      "scroll",
      onScroll
    );

    onScroll();
    trackView();

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, []);

  const artist =
    content?.artist || {
      name: "ANTHRIKSH",
      roles:
        "ARTIST · GUITARIST · SINGER · SONGWRITER",
      tagline:
        "WHAT I COULDN'T SAY.",
      bio:
        "Some things are easier to play than explain.",
    };

  const guitars =
    content?.guitars || [];

  const archive =
    content?.archive || [];

  const music =
    content?.music || [];

  const media =
    content?.media || [];

  const posts =
    content?.posts || [];

  const current =
    content?.currently || {};

  const featured = useMemo(() => {
    return archive.filter(
      (item) =>
        item.featured !== false
    );
  }, [archive]);

  const latestMedia = useMemo(() => {
    return media
      .filter(
        (item) =>
          item &&
          item.url
      )
      .slice(0, 8);
  }, [media]);

  /*
   * POSTS
   *
   * Studio saves:
   * title
   * message
   * type
   * date
   * published
   * showInTicker
   */
  const publishedPosts =
    useMemo(() => {
      return posts
        .filter((post) => {
          if (
            post.published === false
          ) {
            return false;
          }

          if (
            post.showInTicker === false
          ) {
            return false;
          }

          return Boolean(
            post.message ||
            post.title
          );
        })
        .sort((a, b) => {
          const aDate =
            new Date(
              a.date || 0
            ).getTime();

          const bDate =
            new Date(
              b.date || 0
            ).getTime();

          return bDate - aDate;
        })
        .slice(0, 8);
    }, [posts]);

  /*
   * ALL PUBLISHED POSTS
   *
   * Used by the full Studio Notes
   * section further down the page.
   */
  const allPublishedPosts =
    useMemo(() => {
      return posts
        .filter(
          (post) =>
            post.published !== false
        )
        .sort((a, b) => {
          const aDate =
            new Date(
              a.date || 0
            ).getTime();

          const bDate =
            new Date(
              b.date || 0
            ).getTime();

          return bDate - aDate;
        });
    }, [posts]);

  if (!content) {
    return (
      <div className="loadingScreen">
        <span>
          ANTHRIKSH
        </span>

        <i>
          LOADING THE ARCHIVE
        </i>
      </div>
    );
  }

  return (
    <main>

      {/* =====================================================
          ANNOUNCEMENT TICKER
      ===================================================== */}

      {publishedPosts.length > 0 && (
        <div className="announcementTicker">

          <div className="announcementTickerTrack">

            {[
              ...publishedPosts,
              ...publishedPosts,
            ].map(
              (post, index) => {

                const message =
                  post.message ||
                  post.title ||
                  "UPDATE";

                const type =
                  post.type ||
                  "ANNOUNCEMENT";

                let dateLabel = "";

                if (post.date) {
                  const target =
                    new Date(
                      `${post.date}T00:00:00`
                    );

                  const now =
                    new Date();

                  const today =
                    new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate()
                    );

                  const targetDay =
                    new Date(
                      target.getFullYear(),
                      target.getMonth(),
                      target.getDate()
                    );

                  const difference =
                    Math.round(
                      (targetDay -
                        today) /
                        86400000
                    );

                  if (
                    difference === 0
                  ) {
                    dateLabel =
                      "TODAY";
                  } else if (
                    difference === 1
                  ) {
                    dateLabel =
                      "TOMORROW";
                  } else if (
                    difference > 1
                  ) {
                    dateLabel =
                      target
                        .toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )
                        .toUpperCase();
                  }
                }

                return (
                  <a
                    href="#posts"
                    className="announcementItem"
                    key={
                      `${post.id || index}-${index}`
                    }
                  >

                    <span className="announcementDot">
                      ●
                    </span>

                    {dateLabel && (
                      <span className="announcementDate">
                        {dateLabel}
                      </span>
                    )}

                    <span className="announcementLabel">
                      {type}
                    </span>

                    <strong>
                      {message}
                    </strong>

                    <span className="announcementArrow">
                      ↗
                    </span>

                  </a>
                );
              }
            )}

          </div>

        </div>
      )}


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header
        className={`nav ${
          scrolled
            ? "navSolid"
            : ""
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
            ["Music", "music"],
            ["Watch", "media"],
            ["About", "about"],
            ["Posts", "posts"],
            ["Guitars", "guitars"],
            ["Archive", "archive"],
            ["Journal", "journal"],
          ].map(
            ([label, id]) => (
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
            )
          )}

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
              setMenu(
                (value) => !value
              )
            }
          >
            {menu
              ? "CLOSE"
              : "MENU"}
          </button>

        </div>

      </header>


      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {menu && (
        <div className="mobileNav">

          {[
            ["Story", "story"],
            ["Music", "music"],
            ["Watch", "media"],
            ["About", "about"],
            ["Posts", "posts"],
            ["Guitars", "guitars"],
            ["Archive", "archive"],
            ["Journal", "journal"],
          ].map(
            ([label, id]) => (
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
            )
          )}

          <a href="/admin">
            Admin
          </a>

        </div>
      )}


      {/* =====================================================
          HERO
      ===================================================== */}

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

          <span>
            WHAT I
          </span>

          <span>
            COULDN'T
          </span>

          <span>
            SAY.
          </span>

        </div>

        <div className="heroSide">

          <strong>
            01 / 09
          </strong>

          <span>
            ARTIST ARCHIVE
          </span>

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


      {/* =====================================================
          01 / STORY
      ===================================================== */}

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
              I started singing before
              I ever imagined where music
              would take me. Later, I picked
              up a guitar and slowly
              discovered another way to
              express the things I couldn't
              always put into words.
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


      {/* =====================================================
          02 / MUSIC
      ===================================================== */}

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

          music.map(
            (track, index) => (

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

            )
          )

        ) : (

          <div className="emptyLine">
            The first release is
            on its way.
          </div>

        )}

      </section>


      {/* =====================================================
          03 / WATCH
      ===================================================== */}

      <section
        className="homeWatch section"
        id="watch"
      >

        <div className="eyebrow">
          03 / WATCH
        </div>

        <div className="homeWatchHead">

          <h2>
            See what
            <br />
            <em>
              I'm making.
            </em>
          </h2>

          <a href="/media">
            WATCH EVERYTHING ↗
          </a>

        </div>

        {latestMedia.length > 0 ? (

          <div className="shortsRailWrap">

            <div className="shortsRail">

              {latestMedia.map(
                (
                  item,
                  index
                ) => {

                  const mediaId =
                    item.id ||
                    item.storagePath ||
                    item.url ||
                    item.name ||
                    index;

                  return (
                    <a
                      key={mediaId}
                      className="shortCard"
                      href={`/media#${encodeURIComponent(
                        mediaId
                      )}`}
                    >

                      <div className="shortVisual">

                        {item.kind ===
                        "VIDEO" ? (

                          item.thumbnail ? (

                            <img
                              src={
                                item.thumbnail
                              }
                              alt={
                                item.name ||
                                "Anthh video"
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
                              "Anthh media"
                            }
                          />

                        ) : (

                          <div className="shortAudio">

                            <span>
                              AUDIO
                            </span>

                            <strong>
                              {item.name ||
                                "UNTITLED"}
                            </strong>

                          </div>

                        )}

                        <div className="shortOverlay">

                          <span>
                            {item.kind ||
                              "MEDIA"}
                          </span>

                          <b>
                            ↗
                          </b>

                        </div>

                      </div>

                      <div className="shortInfo">

                        <span>
                          {index === 0
                            ? "LATEST"
                            : item.kind ||
                              "MEDIA"}
                        </span>

                        <strong>
                          {item.name ||
                            "UNTITLED"}
                        </strong>

                      </div>

                    </a>
                  );
                }
              )}

            </div>

            <div className="shortsRailFooter">

              <span>
                SWIPE / SCROLL
              </span>

              <a href="/media">
                VIEW ALL MEDIA →
              </a>

            </div>

          </div>

        ) : (

          <div className="emptyLine">
            The next piece is
            on its way.
          </div>

        )}

      </section>


      {/* =====================================================
          04 / ABOUT
      ===================================================== */}

      <section
        id="about"
        className="about section"
      >

        <div className="eyebrow">
          04 / ABOUT
        </div>

        <div className="aboutHero">

          <div className="aboutStatement">

            <span className="aboutScript">
              the person behind
              the music
            </span>

            <h2>
              Still
              <br />
              becoming.
            </h2>

          </div>

          <div className="aboutPortrait">

            <img
              src={
                artist.aboutImage ||
                "/images/about.png"
              }
              alt={`${artist.name} — artist portrait`}
            />

            <span className="aboutPortraitCaption">
              ANTHH / ARTIST · GUITARIST ·
              SINGER · SONGWRITER
            </span>

          </div>

        </div>

        <div className="aboutLower">

          <div className="aboutIntro">

            {artist.about && (
              <p>
                {artist.about}
              </p>
            )}

          </div>

          <div className="aboutCopy">

            {artist.journey && (
              <p>
                I started singing before
                I ever imagined where music
                would take me. Later, I picked
                up a guitar and slowly
                discovered another way to
                express the things I couldn't
                always put into words. For a
                long time, though, I wasn't
                completely serious about music.
                I was afraid that it might not
                work out, and that fear made me
                hold myself back. Eventually,
                I realized that I didn't want to
                spend my life wondering what
                could have happened. I decided
                that I would simply do what
                makes me happy, whether it
                works out exactly the way I hope
                or not. So I keep singing,
                playing guitar, writing songs,
                recording, and learning along
                the way.
              </p>
            )}

            {artist.future && (
              <p>
                {artist.future}
              </p>
            )}

            {artist.producerPitch && (
              <p>
                {artist.producerPitch}
              </p>
            )}

          </div>

        </div>

        <div className="aboutDetails">

          {artist.basedIn && (
            <div>

              <span>
                BASED IN
              </span>

              <strong>
                {artist.basedIn}
              </strong>

            </div>
          )}

          {artist.education && (
            <div>

              <span>
                EDUCATION
              </span>

              <strong>
                {artist.education}
              </strong>

              {artist.educationDetail && (
                <small>
                  {
                    artist.educationDetail
                  }
                </small>
              )}

            </div>
          )}

          {artist.skills && (
            <div>

              <span>
                SKILLS
              </span>

              <strong>
                {artist.skills}
              </strong>

            </div>
          )}

          {artist.contactEmail && (
            <div>

              <span>
                CONTACT
              </span>

              <a
                href={`mailto:${artist.contactEmail}`}
                style={{
                  fontSize:
                    "14px",
                  lineHeight:
                    "1.35",
                  fontWeight:
                    500,
                  textDecoration:
                    "none",
                }}
              >
                {artist.contactEmail}
              </a>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          05 / POSTS
      ===================================================== */}

      <section
        id="posts"
        className="posts section"
      >

        <div className="eyebrow">
          05 / STUDIO NOTES
        </div>

        <div className="postsHeader">

          <h2>
            Notes from
            <br />
            the studio.
          </h2>

          <p>
            Announcements, releases,
            upcoming videos, songs,
            plans and little updates
            from the process.
          </p>

        </div>

        {allPublishedPosts.length > 0 ? (

          <div className="postList">

            {allPublishedPosts.map(
              (
                post,
                index
              ) => (

                <article
                  className="postCard"
                  key={
                    post.id ||
                    index
                  }
                >

                  <div className="postNumber">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="postContent">

                    <div className="postMeta">

                      {post.date && (
                        <span>
                          {formatPostDate(
                            post.date
                          )}
                        </span>
                      )}

                      {post.type && (
                        <span>
                          {post.type}
                        </span>
                      )}

                    </div>

                    <h3>
                      {post.title ||
                        "UNTITLED POST"}
                    </h3>

                    <p>
                      {post.message ||
                        ""}
                    </p>

                  </div>

                  <div className="postArrow">
                    ↗
                  </div>

                </article>

              )
            )}

          </div>

        ) : (

          <div className="postsEmpty">

            <span>
              NOTHING TO ANNOUNCE
            </span>

            <p>
              New updates from
              the studio will
              appear here.
            </p>

          </div>

        )}

      </section>


      {/* =====================================================
          06 / GUITARS
      ===================================================== */}

      <section
        id="guitars"
        className="gear section"
      >

        <div className="eyebrow">
          06 / GUITARS
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
              src={
                guitars[0].image
              }
              alt={
                guitars[0].name
              }
            />
          )}

        </div>

        <div className="gearList">

          {guitars.map(
            (
              guitar,
              index
            ) => (

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


      {/* =====================================================
          07 / ARCHIVE
      ===================================================== */}

      <section
        id="archive"
        className="archive section"
      >

        <div className="eyebrow">
          07 / ARCHIVE
        </div>

        <h2>
          Moments worth
          keeping.
        </h2>

        {featured.length ? (

          featured.map(
            (
              item,
              index
            ) => (

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


      {/* =====================================================
          08 / JOURNAL
      ===================================================== */}

      <section
        id="journal"
        className="dark journal section"
      >

        <div className="eyebrow">
          08 / CURRENTLY
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

              <div key={label}>

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


      {/* =====================================================
          FOOTER
      ===================================================== */}

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

            <a href="#posts">
              Posts
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

            {artist.contactEmail && (
              <a
                href={`mailto:${artist.contactEmail}`}
              >
                Email
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