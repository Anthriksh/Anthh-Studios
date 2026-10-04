"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function mediaKey(item) {
  return (
    item?.id ||
    item?.storagePath ||
    item?.url ||
    item?.name
  );
}

function ThumbIcon({ filled = false }) {
  return (
    <svg
      className={`thumbIcon ${
        filled ? "thumbIconFilled" : ""
      }`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M7.2 10.2v10.1H4.4c-.8 0-1.4-.6-1.4-1.4v-7.3c0-.8.6-1.4 1.4-1.4h2.8Zm2.1 10.1V10l3.8-7.1c.3-.6.9-.9 1.5-.9 1.1 0 1.9 1 1.6 2.1l-.9 3.8h4.1c1.5 0 2.6 1.4 2.3 2.9l-1.3 6.6c-.3 1.6-1.7 2.8-3.4 2.8H9.3Z"
        fill={
          filled
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MediaGallery() {
  const [content, setContent] =
    useState(null);

  const [interactions, setInteractions] =
    useState({});

  const [error, setError] =
    useState("");

  const [comment, setComment] =
    useState({});

  const [name, setName] =
    useState({});

  const [busy, setBusy] =
    useState({});

  const [likeAnimation, setLikeAnimation] =
    useState({});

  useEffect(() => {
    fetch("/api/content", {
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(
            "Could not load the media archive."
          );
        }

        return r.json();
      })
      .then(setContent)
      .catch((e) =>
        setError(e.message)
      );
  }, []);

  const media =
    content?.media || [];

  const ids = useMemo(
    () =>
      media
        .map(mediaKey)
        .filter(Boolean),
    [media]
  );

  useEffect(() => {
    if (!ids.length) return;

    fetch(
      `/api/media/interactions?mediaIds=${ids
        .map(encodeURIComponent)
        .join(",")}`,
      {
        cache: "no-store",
      }
    )
      .then((r) => r.json())
      .then((data) =>
        setInteractions(data || {})
      )
      .catch(() => {});
  }, [ids]);

  function triggerLikeAnimation(id) {
    setLikeAnimation((prev) => ({
      ...prev,
      [id]: true,
    }));

    window.setTimeout(() => {
      setLikeAnimation((prev) => ({
        ...prev,
        [id]: false,
      }));
    }, 650);
  }

  async function interact(
    item,
    type
  ) {
    const id = mediaKey(item);

    if (!id || busy[id]) return;

    setBusy((prev) => ({
      ...prev,
      [id]: type,
    }));

    try {
      if (
        type === "like" &&
        interactions[id]?.liked
      ) {
        const response =
          await fetch(
            "/api/media/interactions",
            {
              method: "DELETE",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                mediaId: id,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Could not remove like."
          );
        }

        setInteractions(
          (prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              likes: Math.max(
                0,
                (prev[id]?.likes ||
                  0) - 1
              ),
              liked: false,
            },
          })
        );

        return;
      }

      const payload = {
        mediaId: id,
        type,
      };

      if (type === "comment") {
        payload.comment =
          comment[id] || "";

        payload.displayName =
          name[id] || "";
      }

      const response =
        await fetch(
          "/api/media/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Could not save interaction."
        );
      }

      setInteractions(
        (prev) => ({
          ...prev,
          [id]: {
            ...(prev[id] || {
              likes: 0,
              shares: 0,
              comments: [],
              liked: false,
            }),

            likes:
              type === "like"
                ? (prev[id]?.likes ||
                    0) + 1
                : prev[id]?.likes ||
                  0,

            shares:
              type === "share"
                ? (prev[id]?.shares ||
                    0) + 1
                : prev[id]?.shares ||
                  0,

            liked:
              type === "like"
                ? true
                : prev[id]?.liked ||
                  false,
          },
        })
      );

      if (type === "like") {
        triggerLikeAnimation(id);
      }

      if (type === "comment") {
        setComment((prev) => ({
          ...prev,
          [id]: "",
        }));
      }

      if (type === "share") {
        const url =
          window.location.origin +
          "/media";

        if (navigator.share) {
          await navigator.share({
            title:
              item.name ||
              "Anthh",
            url,
          });
        } else if (
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(
            url
          );
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy((prev) => ({
        ...prev,
        [id]: false,
      }));
    }
  }

  return (
    <main className="publicMedia">
      <header className="mediaNav">
        <Link
          href="/"
          className="mediaWordmark"
        >
          {content?.artist?.name ||
            "ANTHH"}
        </Link>

        <nav>
          <Link href="/#story">
            STORY
          </Link>

          <Link href="/#music">
            MUSIC
          </Link>

          <Link
            href="/media"
            aria-current="page"
          >
            WATCH
          </Link>

          <Link href="/#guitars">
            GUITARS
          </Link>

          <Link href="/#archive">
            ARCHIVE
          </Link>
        </nav>
      </header>

      <section className="mediaHero">
        <span>
          LATEST / WATCH
        </span>

        <h1>
          See what
          <br />
          <em>I'm making.</em>
        </h1>

        <p>
          Videos, photographs and
          sounds from the Anthh
          archive.
        </p>
      </section>

      {error && (
        <div className="mediaError">
          {error}
        </div>
      )}

      {!content ? (
        <div className="mediaLoading">
          LOADING THE MEDIA ARCHIVE
        </div>
      ) : media.length === 0 ? (
        <section className="mediaEmpty">
          <span>
            THE ARCHIVE IS QUIET.
          </span>

          <h2>
            Nothing has been published
            here yet.
          </h2>

          <p>
            Published media from Studio
            will appear on this page
            automatically.
          </p>
        </section>
      ) : (
        <section className="mediaGrid">
          {media.map((item) => {
            const id =
              mediaKey(item);

            const stats =
              interactions[id] || {
                likes: 0,
                shares: 0,
                liked: false,
                comments: [],
              };

            const isAnimating =
              likeAnimation[id];

            return (
              <article
                className="mediaItem"
                key={
                  id ||
                  item.url ||
                  item.name
                }
              >
                <div className="mediaVisual">
                  {item.kind ===
                  "IMAGE" ? (
                    <img
                      src={item.url}
                      alt={
                        item.name ||
                        "Anthh media"
                      }
                    />
                  ) : item.kind ===
                    "VIDEO" ? (
                    <div className="videoPreview">
                      <video
                        src={item.url}
                        poster={
                          item.thumbnail ||
                          item.poster ||
                          undefined
                        }
                        controls
                        playsInline
                        preload="metadata"
                      />
                    </div>
                  ) : (
                    <div className="mediaAudio">
                      <span>
                        AUDIO
                      </span>

                      <h3>
                        {item.name}
                      </h3>

                      <audio
                        src={item.url}
                        controls
                      />
                    </div>
                  )}
                </div>

                <div className="mediaMeta">
                  <span>
                    {item.kind ||
                      "MEDIA"}
                  </span>

                  <h3>
                    {item.name ||
                      "Untitled"}
                  </h3>

                  <div className="mediaActions">
                    <button
                      className={`facebookLike ${
                        stats.liked
                          ? "isLiked"
                          : ""
                      } ${
                        isAnimating
                          ? "isAnimating"
                          : ""
                      }`}
                      onClick={() =>
                        interact(
                          item,
                          "like"
                        )
                      }
                      disabled={
                        busy[id] ===
                        "like"
                      }
                      aria-label={
                        stats.liked
                          ? "Unlike"
                          : "Like"
                      }
                    >
                      <span className="likeIconWrap">
                        <ThumbIcon
                          filled={
                            stats.liked
                          }
                        />

                        {isAnimating && (
                          <span className="likeBurst">
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
                      </span>

                      <span className="likeText">
                        {stats.liked
                          ? "Liked"
                          : "Like"}
                      </span>

                      <span className="likeCount">
                        {stats.likes}
                      </span>
                    </button>

                    <button
                      className="mediaShareButton"
                      onClick={() =>
                        interact(
                          item,
                          "share"
                        )
                      }
                      disabled={
                        busy[id] ===
                        "share"
                      }
                    >
                      <span>
                        SHARE
                      </span>

                      <span>
                        {stats.shares}
                      </span>
                    </button>
                  </div>

                  <div className="mediaComments">
                    <input
                      value={
                        name[id] || ""
                      }
                      onChange={(e) =>
                        setName(
                          (prev) => ({
                            ...prev,
                            [id]:
                              e.target
                                .value,
                          })
                        )
                      }
                      placeholder="Name (optional)"
                    />

                    <div className="commentRow">
                      <input
                        value={
                          comment[id] ||
                          ""
                        }
                        onChange={(e) =>
                          setComment(
                            (prev) => ({
                              ...prev,
                              [id]:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="Leave a comment..."
                        maxLength={600}
                      />

                      <button
                        onClick={() =>
                          interact(
                            item,
                            "comment"
                          )
                        }
                        disabled={
                          busy[id] ===
                          "comment"
                        }
                      >
                        POST
                      </button>
                    </div>

                    {stats.comments
                      ?.length >
                      0 && (
                      <div className="commentList">
                        {stats.comments.map(
                          (x) => (
                            <div
                              className="comment"
                              key={
                                x.id
                              }
                            >
                              <strong>
                                {x.name}
                              </strong>

                              <p>
                                {x.comment}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}