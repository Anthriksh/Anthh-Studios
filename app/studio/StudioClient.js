"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
const emptyContent = {
  artist: {
    name: "ANTHH",
    roles: "ARTIST · GUITARIST · SINGER · SONGWRITER",
    tagline: "WHAT I COULDN'T SAY.",
    bio: "",
    about: "",
    heroImage: "/images/hero.png",
    storyImage: "/images/acoustic.png",
    musicIntro: "",
    guitarsIntro: "",
    instagram: "",
    youtube: "",
    spotify: "",
    hometown: "",
    basedIn: "Hyderabad, India",
    education: "B.Tech — CSE (AI & ML)",
    educationDetail:
      "Student, building a creative life alongside technology.",
    journey: "",
    future: "",
    producerPitch: "",
    skills:
      "Guitar · Vocals · Songwriting · Recording · Creative Direction",
    contactEmail: "",
  },
  music: [],
  guitars: [],
  archive: [],
  currently: {
    playing: "",
    listeningTo: "",
    writing: "",
    recording: "",
  },
  media: [],
};

function normalizeContent(data) {
  const artist = data?.artist || {};

  return {
    ...emptyContent,
    ...data,
    artist: {
      ...emptyContent.artist,
      ...artist,
      tagline:
        artist.tagline ??
        artist.hero ??
        emptyContent.artist.tagline,
    },
    music: Array.isArray(data?.music) ? data.music : [],
    guitars: Array.isArray(data?.guitars) ? data.guitars : [],
    archive: Array.isArray(data?.archive) ? data.archive : [],
    currently: {
      ...emptyContent.currently,
      ...(data?.currently || {}),
    },
    media: Array.isArray(data?.media) ? data.media : [],
  };
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export default function StudioClient() {
  const [content, setContent] = useState(emptyContent);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("content");
  const [status, setStatus] = useState("READY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const res = await fetch("/api/content", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Load failed (${res.status})`);
      }

      const data = await res.json();
      const normalized = normalizeContent(data);

      setContent(normalized);
      setMedia(normalized.media);
    } catch (e) {
      setError(e.message);
      setStatus("ERROR");
    }
  }

  async function registerTouchID() {
    setError("");
    setStatus("SETTING UP TOUCH ID…");

    try {
      const optionsRes = await fetch(
        "/api/admin/passkey/register-options",
        {
          cache: "no-store",
        }
      );

      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(
          options.error || "Could not start Touch ID setup."
        );
      }

      const credential = await startRegistration({
        optionsJSON: options,
      });

      const verifyRes = await fetch(
        "/api/admin/passkey/register-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(credential),
        }
      );

      const data = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok) {
        throw new Error(
          data.error || "Touch ID setup failed."
        );
      }

      setStatus("TOUCH ID READY ✓");
    } catch (e) {
      setError(
        e.message || "Touch ID setup was cancelled."
      );
      setStatus("READY");
    }
  }

  function updateArtist(field, value) {
    setContent((prev) => ({
      ...prev,
      artist: {
        ...prev.artist,
        [field]: value,
      },
    }));

    setStatus("READY TO PUBLISH");
  }

  function updateCurrently(field, value) {
    setContent((prev) => ({
      ...prev,
      currently: {
        ...prev.currently,
        [field]: value,
      },
    }));

    setStatus("READY TO PUBLISH");
  }

  function updateList(key, id, field, value) {
    setContent((prev) => ({
      ...prev,
      [key]: prev[key].map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));

    setStatus("READY TO PUBLISH");
  }

  function removeList(key, id) {
    if (
      !window.confirm(
        "Remove this item? You can only restore it from your backup."
      )
    ) {
      return;
    }

    setContent((prev) => ({
      ...prev,
      [key]: prev[key].filter(
        (item) => item.id !== id
      ),
    }));

    setStatus("READY TO PUBLISH");
  }

  function addMusic() {
    setContent((prev) => ({
      ...prev,
      music: [
        {
          id: makeId("track"),
          title: "NEW TRACK",
          description: "",
          type: "ORIGINAL",
          audio: "",
        },
        ...prev.music,
      ],
    }));

    setStatus("READY TO PUBLISH");
  }

  function addGuitar() {
    setContent((prev) => ({
      ...prev,
      guitars: [
        {
          id: makeId("guitar"),
          name: "NEW GUITAR",
          type: "ELECTRIC",
          description: "",
          specs: "",
          image: "",
        },
        ...prev.guitars,
      ],
    }));

    setStatus("READY TO PUBLISH");
  }

  function addArchive() {
    setContent((prev) => ({
      ...prev,
      archive: [
        {
          id: makeId("archive"),
          title: "NEW ARCHIVE ENTRY",
          type: "RECENT",
          description: "",
          image: "",
          url: "",
          mediaType: "IMAGE",
          featured: true,
          date: new Date()
            .toISOString()
            .slice(0, 10),
        },
        ...prev.archive,
      ],
    }));

    setStatus("READY TO PUBLISH");
  }

  async function save() {
    if (saving) return;

    setSaving(true);
    setError("");
    setStatus("PUBLISHING…");

    try {
      const payload = normalizeContent(content);

      const res = await fetch(
        "/api/admin/content",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const raw = await res.text();

      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Publish failed (${res.status})`
        );
      }

      const saved = normalizeContent(
        data.content || payload
      );

      setContent(saved);
      setMedia(saved.media);
      setStatus("PUBLISHED ✓");

      setTimeout(() => {
        setStatus("READY");
      }, 2500);
    } catch (e) {
      setStatus("PUBLISH FAILED");
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function uploadFiles(fileList) {
  const files = Array.from(fileList || []);

  if (!files.length) return;

  const supabase = getSupabaseBrowserClient();

  setUploading(true);
  setError("");
  setStatus("PREPARING UPLOAD…");

  try {
    for (const file of files) {
      setStatus(`PREPARING ${file.name}…`);

      const prepareRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
        }),
      });

      const prepared = await prepareRes.json().catch(() => ({}));

      if (!prepareRes.ok) {
        throw new Error(
          prepared.error ||
          `Upload preparation failed (${prepareRes.status})`
        );
      }

      if (!prepared.path || !prepared.token) {
        throw new Error(
          "Supabase did not return a valid upload token."
        );
      }

      setStatus(`UPLOADING ${file.name}…`);

      const { data, error } = await supabase.storage
        .from("anthh-media")
        .uploadToSignedUrl(
          prepared.path,
          prepared.token,
          file,
          {
            contentType: file.type,
            cacheControl: "3600",
          }
        );

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(
          error.message || "Supabase upload failed."
        );
      }

      console.log("Upload successful:", data);

      const mediaItem = {
        ok: true,
        url: prepared.url,
        storagePath: prepared.storagePath,
        name: prepared.name,
        type: prepared.type,
        kind: prepared.kind,
      };

      setMedia((prev) => [
        mediaItem,
        ...prev,
      ]);

      setContent((prev) => ({
        ...prev,
        media: [
          mediaItem,
          ...(prev.media || []),
        ],
      }));

      setStatus(
        `${file.name} UPLOADED · READY TO PUBLISH`
      );
    }
  } catch (e) {
    console.error("UPLOAD FAILED:", e);

    setError(
      e?.message ||
      "Upload failed."
    );

    setStatus("UPLOAD FAILED");
  } finally {
    setUploading(false);
  }
}
  async function deleteMedia(item) {
    try {
      if (!item?.storagePath) {
        throw new Error(
          "This media item has no Supabase storage path. Re-upload it before deleting."
        );
      }

      const res = await fetch(
        "/api/admin/upload/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            storagePath:
              item.storagePath,
          }),
        }
      );

      const data =
        await res.json().catch(
          () => ({})
        );

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Delete failed (${res.status})`
        );
      }

      const url = item.url;

      setMedia((prev) =>
        prev.filter(
          (mediaItem) =>
            mediaItem.url !== url
        )
      );

      setContent((prev) => ({
        ...prev,

        media: (prev.media || []).filter(
          (mediaItem) =>
            mediaItem.url !== url
        ),

        archive: (
          prev.archive || []
        ).filter(
          (archiveItem) =>
            archiveItem.url !== url &&
            archiveItem.image !== url
        ),

        music: (
          prev.music || []
        ).filter(
          (musicItem) =>
            musicItem.audio !== url
        ),
      }));

      setStatus(
        "MEDIA DELETED · READY TO PUBLISH"
      );
    } catch (e) {
      setError(
        e.message || "Delete failed."
      );
    }
  }

  function addMediaToArchive(item) {
    const title = window.prompt(
      "Archive title",
      item.name || "Untitled"
    );

    if (title === null) return;

    const description = window.prompt(
      "Archive description",
      ""
    );

    if (description === null) return;

    const entry = {
      id: makeId("archive"),
      title:
        title.trim() || "Untitled",
      type:
        item.kind || "RECENT",
      description:
        description.trim(),
      url: item.url,
      image:
        item.kind === "IMAGE"
          ? item.url
          : undefined,
      mediaType: item.kind,
      featured: true,
      date: new Date()
        .toISOString()
        .slice(0, 10),
    };

    setContent((prev) => ({
      ...prev,
      archive: [
        entry,
        ...(prev.archive || []),
      ],
    }));

    setStatus("READY TO PUBLISH");
  }

  function addMediaToMusic(item) {
    const title = window.prompt(
      "Track title",
      item.name || "Untitled"
    );

    if (title === null) return;

    const description = window.prompt(
      "Track description",
      ""
    );

    if (description === null) return;

    const entry = {
      id: makeId("track"),
      title:
        title.trim() || "Untitled",
      description:
        description.trim(),
      audio: item.url,
      type: "TRACK",
    };

    setContent((prev) => ({
      ...prev,
      music: [
        entry,
        ...(prev.music || []),
      ],
    }));

    setStatus("READY TO PUBLISH");
  }

  async function logout() {
    await fetch(
      "/api/admin/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    window.location.href = "/admin";
  }

  const tabs = [
    "content",
    "music",
    "guitars",
    "archive",
    "media",
    "settings",
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>
            ANTHH / STUDIO
          </div>

          <h1 style={styles.title}>
            Studio
          </h1>
        </div>

        <div style={styles.headerActions}>
          <a
            href="/"
            style={styles.secondary}
          >
            VIEW SITE ↗
          </a>

          <button
            type="button"
            onClick={logout}
            style={styles.secondaryButton}
          >
            LOG OUT
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              ...styles.publish,
              opacity: saving ? 0.6 : 1,
              cursor: saving
                ? "wait"
                : "pointer",
            }}
          >
            {saving
              ? "PUBLISHING…"
              : "PUBLISH CHANGES"}
          </button>
        </div>
      </header>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <nav style={styles.tabs}>
        {tabs.map((name) => (
          <button
            type="button"
            key={name}
            onClick={() => setTab(name)}
            style={{
              ...styles.tab,
              ...(tab === name
                ? styles.activeTab
                : {}),
            }}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </nav>

      {tab === "content" && (
        <ContentEditor
          content={content}
          updateArtist={updateArtist}
          updateCurrently={
            updateCurrently
          }
        />
      )}

      {tab === "music" && (
        <MusicEditor
          items={content.music}
          add={addMusic}
          update={updateList}
          remove={removeList}
        />
      )}

      {tab === "guitars" && (
        <GuitarEditor
          items={content.guitars}
          add={addGuitar}
          update={updateList}
          remove={removeList}
        />
      )}

      {tab === "archive" && (
        <ArchiveEditor
          items={content.archive}
          add={addArchive}
          update={updateList}
          remove={removeList}
        />
      )}

      {tab === "media" && (
        <MediaEditor
          media={media}
          uploading={uploading}
          uploadFiles={uploadFiles}
          addArchive={addMediaToArchive}
          addMusic={addMediaToMusic}
          deleteMedia={deleteMedia}
        />
      )}

      {tab === "settings" && (
        <section style={styles.panel}>
          <div style={styles.kicker}>
            SECURITY
          </div>

          <h2 style={styles.h2}>
            Studio access
          </h2>

          <p style={styles.muted}>
            Your admin session stays signed
            in for up to 30 days. You can
            enroll this Mac's Touch ID as a
            passkey so future logins can use
            biometric authentication instead
            of typing the password.
          </p>

          <button
            type="button"
            onClick={registerTouchID}
            style={styles.bigPublish}
          >
            ENABLE TOUCH ID / PASSKEY
          </button>

          <div style={styles.note}>
            Use Safari on macOS with Touch ID
            enabled. Password login remains
            available as a fallback.
          </div>
        </section>
      )}

      {tab !== "settings" && (
        <div style={styles.bottomBar}>
          <span>{status}</span>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={styles.bigPublish}
          >
            {saving
              ? "PUBLISHING…"
              : "PUBLISH CHANGES"}
          </button>
        </div>
      )}
    </main>
  );
}

function ContentEditor({
  content,
  updateArtist,
  updateCurrently,
}) {
  const artist = content.artist;

  return (
    <section style={styles.panel}>
      <div style={styles.sectionHead}>
        <div>
          <div style={styles.kicker}>
            PUBLIC PROFILE
          </div>

          <h2 style={styles.h2}>
            Artist identity
          </h2>
        </div>

        <span style={styles.status}>
          EDIT ALL PROFILE COPY
        </span>
      </div>

      <Field label="Artist / pen name">
        <input
          style={styles.input}
          value={artist.name || ""}
          onChange={(e) =>
            updateArtist(
              "name",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Roles">
        <input
          style={styles.input}
          value={artist.roles || ""}
          onChange={(e) =>
            updateArtist(
              "roles",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Hero / tagline">
        <input
          style={styles.input}
          value={artist.tagline || ""}
          onChange={(e) =>
            updateArtist(
              "tagline",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Bio">
        <textarea
          style={styles.textarea}
          rows={6}
          value={artist.bio || ""}
          onChange={(e) =>
            updateArtist(
              "bio",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="About">
        <textarea
          style={styles.textarea}
          rows={6}
          value={artist.about || ""}
          onChange={(e) =>
            updateArtist(
              "about",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Music intro">
        <textarea
          style={styles.textarea}
          rows={3}
          value={artist.musicIntro || ""}
          onChange={(e) =>
            updateArtist(
              "musicIntro",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Guitars intro">
        <textarea
          style={styles.textarea}
          rows={3}
          value={artist.guitarsIntro || ""}
          onChange={(e) =>
            updateArtist(
              "guitarsIntro",
              e.target.value
            )
          }
        />
      </Field>

      <div style={styles.twoCol}>
        <Field label="Hero image URL">
          <input
            style={styles.input}
            value={artist.heroImage || ""}
            onChange={(e) =>
              updateArtist(
                "heroImage",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="Story image URL">
          <input
            style={styles.input}
            value={artist.storyImage || ""}
            onChange={(e) =>
              updateArtist(
                "storyImage",
                e.target.value
              )
            }
          />
        </Field>
      </div>

      <div style={styles.twoCol}>
        <Field label="Instagram URL">
          <input
            style={styles.input}
            value={artist.instagram || ""}
            onChange={(e) =>
              updateArtist(
                "instagram",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="YouTube URL">
          <input
            style={styles.input}
            value={artist.youtube || ""}
            onChange={(e) =>
              updateArtist(
                "youtube",
                e.target.value
              )
            }
          />
        </Field>
      </div>

      <Field label="Spotify URL">
        <input
          style={styles.input}
          value={artist.spotify || ""}
          onChange={(e) =>
            updateArtist(
              "spotify",
              e.target.value
            )
          }
        />
      </Field>

      <div style={styles.subHead}>
        <div className="kicker">
          ABOUT / PROFESSIONAL PROFILE
        </div>

        <h3 style={styles.h3}>
          Help people understand the
          artist behind the work
        </h3>

        <p style={styles.muted}>
          This powers the public About page
          and is written for new listeners,
          collaborators, producers and
          studios.
        </p>
      </div>

      <div style={styles.twoCol}>
        <Field label="Hometown">
          <input
            style={styles.input}
            value={artist.hometown || ""}
            placeholder="Your hometown"
            onChange={(e) =>
              updateArtist(
                "hometown",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="Based in">
          <input
            style={styles.input}
            value={artist.basedIn || ""}
            onChange={(e) =>
              updateArtist(
                "basedIn",
                e.target.value
              )
            }
          />
        </Field>
      </div>

      <div style={styles.twoCol}>
        <Field label="What I'm studying">
          <input
            style={styles.input}
            value={artist.education || ""}
            onChange={(e) =>
              updateArtist(
                "education",
                e.target.value
              )
            }
          />
        </Field>

        <Field label="Study / life detail">
          <input
            style={styles.input}
            value={
              artist.educationDetail || ""
            }
            onChange={(e) =>
              updateArtist(
                "educationDetail",
                e.target.value
              )
            }
          />
        </Field>
      </div>

      <Field label="My journey">
        <textarea
          style={styles.textarea}
          rows={6}
          value={artist.journey || ""}
          onChange={(e) =>
            updateArtist(
              "journey",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="What I want to become / future">
        <textarea
          style={styles.textarea}
          rows={6}
          value={artist.future || ""}
          onChange={(e) =>
            updateArtist(
              "future",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Producer / professional pitch">
        <textarea
          style={styles.textarea}
          rows={6}
          value={artist.producerPitch || ""}
          onChange={(e) =>
            updateArtist(
              "producerPitch",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Skills (separate with ·)">
        <input
          style={styles.input}
          value={artist.skills || ""}
          onChange={(e) =>
            updateArtist(
              "skills",
              e.target.value
            )
          }
        />
      </Field>

      <Field label="Professional email">
        <input
          type="email"
          style={styles.input}
          value={artist.contactEmail || ""}
          placeholder="you@example.com"
          onChange={(e) =>
            updateArtist(
              "contactEmail",
              e.target.value
            )
          }
        />
      </Field>

      <div style={styles.subHead}>
        <div className="kicker">
          CURRENTLY / JOURNAL
        </div>

        <h3 style={styles.h3}>
          What you're doing now
        </h3>
      </div>

      <div style={styles.twoCol}>
        {[
          "playing",
          "listeningTo",
          "writing",
          "recording",
        ].map((field) => (
          <Field
            key={field}
            label={
              field === "listeningTo"
                ? "Listening to"
                : field[0].toUpperCase() +
                  field.slice(1)
            }
          >
            <input
              style={styles.input}
              value={
                content.currently?.[
                  field
                ] || ""
              }
              onChange={(e) =>
                updateCurrently(
                  field,
                  e.target.value
                )
              }
            />
          </Field>
        ))}
      </div>
    </section>
  );
}

function MusicEditor({
  items,
  add,
  update,
  remove,
}) {
  return (
    <section style={styles.panel}>
      <EditorHeader
        kicker="MUSIC / RELEASES"
        title="Music"
        button="ADD TRACK"
        onAdd={add}
      />

      {!items.length && (
        <Empty
          text="No tracks yet. Add your first track here, or upload audio in Media and use ADD TO MUSIC."
        />
      )}

      <div style={styles.editorList}>
        {items.map((item, i) => (
          <article
            key={item.id || i}
            style={styles.editorCard}
          >
            <div style={styles.cardTop}>
              <span style={styles.number}>
                {String(i + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <strong>
                {item.title ||
                  "UNTITLED"}
              </strong>

              <button
                type="button"
                onClick={() =>
                  remove(
                    "music",
                    item.id
                  )
                }
                style={
                  styles.deleteButton
                }
              >
                REMOVE
              </button>
            </div>

            <div style={styles.twoCol}>
              <Field label="Title">
                <input
                  style={styles.input}
                  value={item.title || ""}
                  onChange={(e) =>
                    update(
                      "music",
                      item.id,
                      "title",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Type">
                <input
                  style={styles.input}
                  value={item.type || ""}
                  onChange={(e) =>
                    update(
                      "music",
                      item.id,
                      "type",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>

            <Field label="Description">
              <input
                style={styles.input}
                value={
                  item.description || ""
                }
                onChange={(e) =>
                  update(
                    "music",
                    item.id,
                    "description",
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Audio URL">
              <input
                style={styles.input}
                placeholder="/uploads/track.mp3"
                value={item.audio || ""}
                onChange={(e) =>
                  update(
                    "music",
                    item.id,
                    "audio",
                    e.target.value
                  )
                }
              />
            </Field>

            {item.audio && (
              <audio
                controls
                src={item.audio}
                style={{
                  width: "100%",
                }}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function GuitarEditor({
  items,
  add,
  update,
  remove,
}) {
  return (
    <section style={styles.panel}>
      <EditorHeader
        kicker="GUITARS / GEAR"
        title="Guitars"
        button="ADD GUITAR"
        onAdd={add}
      />

      {!items.length && (
        <Empty
          text="No guitars yet. Add the instruments that define your sound."
        />
      )}

      <div style={styles.editorList}>
        {items.map((item, i) => (
          <article
            key={item.id || i}
            style={styles.editorCard}
          >
            <div style={styles.cardTop}>
              <span style={styles.number}>
                {String(i + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <strong>
                {item.name ||
                  "NEW GUITAR"}
              </strong>

              <button
                type="button"
                onClick={() =>
                  remove(
                    "guitars",
                    item.id
                  )
                }
                style={
                  styles.deleteButton
                }
              >
                REMOVE
              </button>
            </div>

            <div style={styles.twoCol}>
              <Field label="Name">
                <input
                  style={styles.input}
                  value={item.name || ""}
                  onChange={(e) =>
                    update(
                      "guitars",
                      item.id,
                      "name",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Type">
                <input
                  style={styles.input}
                  value={item.type || ""}
                  onChange={(e) =>
                    update(
                      "guitars",
                      item.id,
                      "type",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                style={styles.textarea}
                rows={3}
                value={
                  item.description || ""
                }
                onChange={(e) =>
                  update(
                    "guitars",
                    item.id,
                    "description",
                    e.target.value
                  )
                }
              />
            </Field>

            <div style={styles.twoCol}>
              <Field label="Specs">
                <input
                  style={styles.input}
                  value={item.specs || ""}
                  onChange={(e) =>
                    update(
                      "guitars",
                      item.id,
                      "specs",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Image URL">
                <input
                  style={styles.input}
                  value={item.image || ""}
                  onChange={(e) =>
                    update(
                      "guitars",
                      item.id,
                      "image",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>

            {item.image && (
              <img
                src={item.image}
                alt={
                  item.name ||
                  "Guitar"
                }
                style={
                  styles.inlineImage
                }
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchiveEditor({
  items,
  add,
  update,
  remove,
}) {
  return (
    <section style={styles.panel}>
      <EditorHeader
        kicker="ARCHIVE / MOMENTS"
        title="Archive"
        button="ADD ENTRY"
        onAdd={add}
      />

      {!items.length && (
        <Empty
          text="No archive entries yet. Add a moment or use Media → ADD TO ARCHIVE."
        />
      )}

      <div style={styles.editorList}>
        {items.map((item, i) => (
          <article
            key={item.id || i}
            style={styles.editorCard}
          >
            <div style={styles.cardTop}>
              <span style={styles.number}>
                {String(i + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <strong>
                {item.title ||
                  "UNTITLED"}
              </strong>

              <button
                type="button"
                onClick={() =>
                  remove(
                    "archive",
                    item.id
                  )
                }
                style={
                  styles.deleteButton
                }
              >
                REMOVE
              </button>
            </div>

            <div style={styles.twoCol}>
              <Field label="Title">
                <input
                  style={styles.input}
                  value={item.title || ""}
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "title",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Type">
                <input
                  style={styles.input}
                  value={item.type || ""}
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "type",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                style={styles.textarea}
                rows={3}
                value={
                  item.description || ""
                }
                onChange={(e) =>
                  update(
                    "archive",
                    item.id,
                    "description",
                    e.target.value
                  )
                }
              />
            </Field>

            <div style={styles.twoCol}>
              <Field label="Image / media URL">
                <input
                  style={styles.input}
                  value={
                    item.image ||
                    item.url ||
                    ""
                  }
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "image",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  style={styles.input}
                  value={item.date || ""}
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "date",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>

            <div style={styles.twoCol}>
              <Field label="Media type">
                <input
                  style={styles.input}
                  value={
                    item.mediaType ||
                    "IMAGE"
                  }
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "mediaType",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Featured">
                <select
                  style={styles.input}
                  value={
                    item.featured === false
                      ? "false"
                      : "true"
                  }
                  onChange={(e) =>
                    update(
                      "archive",
                      item.id,
                      "featured",
                      e.target.value ===
                        "true"
                    )
                  }
                >
                  <option value="true">
                    YES — SHOW PUBLICLY
                  </option>

                  <option value="false">
                    NO — HIDE
                  </option>
                </select>
              </Field>
            </div>

            {(item.image ||
              item.url) && (
              <img
                src={
                  item.image ||
                  item.url
                }
                alt={
                  item.title ||
                  "Archive"
                }
                style={
                  styles.inlineImage
                }
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function MediaEditor({
  media,
  uploading,
  uploadFiles,
  addArchive,
  addMusic,
  deleteMedia,
}) {
  return (
    <section style={styles.panel}>
      <div style={styles.sectionHead}>
        <div>
          <div style={styles.kicker}>
            MEDIA LIBRARY
          </div>

          <h2 style={styles.h2}>
            Upload your work
          </h2>
        </div>

        <span style={styles.status}>
          IMAGES · VIDEO · AUDIO
        </span>
      </div>

      <label style={styles.uploadBox}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4"
          onChange={(e) => {
            uploadFiles(
              e.target.files
            );
            e.target.value = "";
          }}
          style={styles.fileInput}
        />

        <strong>
          {uploading
            ? "UPLOADING…"
            : "CHOOSE FILES"}
        </strong>

        <span>
          Upload images, videos or
          audio · up to 200 MB per file
        </span>
      </label>

      {!media.length && (
        <Empty
          text="Your media library is empty. Upload photographs, videos or audio here."
        />
      )}

      <div style={styles.mediaGrid}>
        {media.map((item) => (
          <article
            key={item.url}
            style={styles.mediaCard}
          >
            {item.kind === "IMAGE" ? (
              <img
                src={item.url}
                alt={item.name}
                style={
                  styles.mediaPreview
                }
              />
            ) : item.kind === "VIDEO" ? (
              <video
                src={item.url}
                controls
                style={
                  styles.mediaPreview
                }
              />
            ) : (
              <div
                style={
                  styles.audioPreview
                }
              >
                <span>AUDIO</span>

                <audio
                  src={item.url}
                  controls
                />
              </div>
            )}

            <div style={styles.mediaMeta}>
              <strong>
                {item.name}
              </strong>

              <span>
                {item.kind}
              </span>

              <div
                style={
                  styles.mediaActions
                }
              >
                {(item.kind === "IMAGE" ||
                  item.kind === "VIDEO") && (
                  <button
                    type="button"
                    onClick={() =>
                      addArchive(item)
                    }
                    style={
                      styles.actionButton
                    }
                  >
                    ADD TO ARCHIVE
                  </button>
                )}

                {item.kind ===
                  "AUDIO" && (
                  <button
                    type="button"
                    onClick={() =>
                      addMusic(item)
                    }
                    style={
                      styles.actionButton
                    }
                  >
                    ADD TO MUSIC
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    deleteMedia(item)
                  }
                  style={
                    styles.deleteButton
                  }
                >
                  DELETE
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p style={styles.muted}>
        Uploading stores the file. Adding
        it to Music or Archive connects it
        to the public site. Press{" "}
        <b>PUBLISH CHANGES</b> after editing.
      </p>
    </section>
  );
}

function EditorHeader({
  kicker,
  title,
  button,
  onAdd,
}) {
  return (
    <div style={styles.sectionHead}>
      <div>
        <div style={styles.kicker}>
          {kicker}
        </div>

        <h2 style={styles.h2}>
          {title}
        </h2>

        <p style={styles.muted}>
          Create, edit, remove and publish
          entries. Every saved change is
          used by the public site.
        </p>
      </div>

      <button
        type="button"
        onClick={onAdd}
        style={styles.actionButton}
      >
        {button}
      </button>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={styles.empty}>
      {text}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: "#f3f0e8",
    padding:
      "32px clamp(18px, 5vw, 72px) 100px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 24,
    borderBottom: "1px solid #333",
    paddingBottom: 28,
  },

  kicker: {
    fontSize: 11,
    letterSpacing: ".18em",
    opacity: 0.6,
  },

  title: {
    fontSize: "clamp(42px, 7vw, 88px)",
    lineHeight: 0.9,
    margin: "12px 0 0",
    fontWeight: 500,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  secondary: {
    color: "#f3f0e8",
    textDecoration: "none",
    border: "1px solid #444",
    padding: "13px 16px",
    fontSize: 11,
    letterSpacing: ".12em",
  },

  secondaryButton: {
    background: "transparent",
    color: "#f3f0e8",
    border: "1px solid #444",
    padding: "13px 16px",
    fontSize: 11,
    letterSpacing: ".12em",
    cursor: "pointer",
  },

  publish: {
    border: 0,
    background: "#f3f0e8",
    color: "#0d0d0d",
    padding: "14px 18px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".12em",
  },

  error: {
    marginTop: 20,
    border: "1px solid #8b3d3d",
    background: "#2a1515",
    padding: 16,
    color: "#ffb5b5",
    fontSize: 13,
  },

  tabs: {
    display: "flex",
    gap: 4,
    margin: "28px 0",
    flexWrap: "wrap",
  },

  tab: {
    background: "transparent",
    color: "#999",
    border: "1px solid #292929",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 11,
    letterSpacing: ".1em",
  },

  activeTab: {
    color: "#f3f0e8",
    border: "1px solid #777",
  },

  panel: {
    maxWidth: 1050,
    border: "1px solid #292929",
    padding:
      "clamp(20px, 4vw, 42px)",
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-end",
    marginBottom: 30,
  },

  h2: {
    fontSize: 32,
    fontWeight: 400,
    margin: "8px 0 0",
  },

  h3: {
    fontSize: 20,
    fontWeight: 400,
    margin: "8px 0 18px",
  },

  status: {
    fontSize: 10,
    letterSpacing: ".14em",
    opacity: 0.7,
    whiteSpace: "nowrap",
  },

  field: {
    display: "block",
    margin: "0 0 22px",
    minWidth: 0,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 8,
    background: "#151515",
    color: "#f3f0e8",
    border: "1px solid #444",
    padding: "14px",
    outline: "none",
    fontSize: 15,
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 8,
    background: "#151515",
    color: "#f3f0e8",
    border: "1px solid #444",
    padding: "14px",
    outline: "none",
    fontSize: 15,
    resize: "vertical",
    fontFamily: "inherit",
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  subHead: {
    borderTop: "1px solid #292929",
    paddingTop: 28,
    marginTop: 18,
  },

  muted: {
    color: "#999",
    lineHeight: 1.7,
    maxWidth: 720,
  },

  bigPublish: {
    width: "100%",
    background: "#f3f0e8",
    color: "#0d0d0d",
    border: 0,
    padding: "17px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: ".15em",
    cursor: "pointer",
  },

  bottomBar: {
    maxWidth: 1050,
    display: "grid",
    gridTemplateColumns:
      "1fr auto",
    alignItems: "center",
    gap: 20,
    marginTop: 20,
    position: "sticky",
    bottom: 18,
    background:
      "rgba(13,13,13,.96)",
    padding: 12,
    border: "1px solid #292929",
    backdropFilter: "blur(10px)",
  },

  editorList: {
    display: "grid",
    gap: 16,
  },

  editorCard: {
    border: "1px solid #292929",
    padding: 20,
    background: "#111",
  },

  cardTop: {
    display: "grid",
    gridTemplateColumns:
      "40px 1fr auto",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  number: {
    fontSize: 11,
    letterSpacing: ".1em",
    opacity: 0.5,
  },

  deleteButton: {
    justifySelf: "start",
    background: "transparent",
    color: "#f3f0e8",
    border: "1px solid #555",
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 10,
    letterSpacing: ".1em",
  },

  actionButton: {
    background: "#f3f0e8",
    color: "#0d0d0d",
    border: 0,
    padding: "9px 11px",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".08em",
  },

  empty: {
    border: "1px dashed #444",
    padding: 28,
    color: "#888",
    marginBottom: 18,
    lineHeight: 1.6,
  },

  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 180,
    border: "1px dashed #666",
    background: "#111",
    marginBottom: 28,
    textAlign: "center",
    cursor: "pointer",
  },

  fileInput: {
    width: "100%",
    padding: 40,
    color: "#aaa",
    cursor: "pointer",
  },

  mediaGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(220px,1fr))",
    gap: 16,
    marginBottom: 28,
  },

  mediaCard: {
    border: "1px solid #292929",
    background: "#111",
    overflow: "hidden",
  },

  mediaPreview: {
    width: "100%",
    aspectRatio: "16/10",
    objectFit: "cover",
    display: "block",
    background: "#000",
  },

  audioPreview: {
    minHeight: 130,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 16,
    padding: 18,
    background: "#151515",
  },

  mediaMeta: {
    display: "grid",
    gap: 7,
    padding: 14,
    fontSize: 11,
  },

  mediaActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  inlineImage: {
    display: "block",
    width: "100%",
    maxHeight: 300,
    objectFit: "cover",
    marginTop: 6,
  },

  note: {
    marginTop: 18,
    color: "#777",
    fontSize: 12,
    lineHeight: 1.6,
  },
};