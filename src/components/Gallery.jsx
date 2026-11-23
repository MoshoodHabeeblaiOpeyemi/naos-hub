import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import ImageUploader from "./ImageUploader.jsx";

// Firestore collection the gallery reads from / writes to.
// NOTE: 'events' is shared with your Events page, so every uploaded photo also
// shows up there as a fake "event". Point this at a dedicated collection
// (e.g. 'gallery') once you've added a Firestore rule for it.
const GALLERY_COLLECTION = "events";

const UPLOADER_ROLES = ["pro1", "pro2", "president"];

/**
 * Accepts whatever ImageUploader hands back — a File/Blob or a data-URL string —
 * and returns { payload, name } ready to append to FormData.
 */
function normalizeImage(input) {
  if (typeof input === "string") {
    const base64 = input.includes(",") ? input.split(",")[1] : input;
    return { payload: base64, name: "Event Photo" };
  }
  return { payload: input, name: input?.name || "Event Photo" };
}

export default function Gallery({ userProfile }) {
  const [events, setEvents] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = auth?.currentUser?.uid;
  const canUpload = UPLOADER_ROLES.includes(
    (userProfile?.role || "").toLowerCase(),
  );

  useEffect(() => {
    if (!db) return;

    const eventsRef = collection(db, GALLERY_COLLECTION);
    const q = query(eventsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEvents(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })),
        );
      },
      (err) => {
        console.error("Gallery load error:", err);
        setError("Could not load gallery photos.");
      },
    );

    return () => unsubscribe();
  }, []);

  const handleUpload = async (input) => {
    if (!input || isUploading) return;

    if (!db || !currentUserId) {
      setError("Please sign in to upload photos.");
      return;
    }

    const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!imgbbApiKey) {
      setError("Image hosting key is missing (VITE_IMGBB_API_KEY).");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const { payload, name } = normalizeImage(input);

      // ImgBB wants multipart/form-data — NOT a JSON body.
      const formData = new FormData();
      formData.append("image", payload);

      const response = await fetch(
        "https://api.imgbb.com/1/upload?key=" + encodeURIComponent(imgbbApiKey),
        { method: "POST", body: formData },
      );

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.data?.url) {
        const reason =
          typeof data?.error === "string" ? data.error : data?.error?.message;
        throw new Error(reason || "ImgBB upload failed");
      }

      await addDoc(collection(db, GALLERY_COLLECTION), {
        title: name,
        date: new Date().toISOString().split("T")[0],
        time: "",
        location: "",
        description: "Event photo uploaded by " + (userProfile?.name || "PRO"),
        kind: "general",
        photo: data.data.url,
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Gallery upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  };

  // A gallery should only show entries that actually have a photo.
  const photos = events.filter((event) => event.photo);

  return (
    <div className="py-10 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-naos-dark mb-6">
          Verified Members Gallery
        </h1>

        {/* Upload section for PROs */}
        {canUpload && (
          <div className="mb-6 rounded-lg border border-naos-gray/40 bg-white p-6">
            <h2 className="text-lg font-bold text-naos-dark mb-4">
              Upload Event Photo
            </h2>
            <ImageUploader onImageUploaded={handleUpload} />

            {isUploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-naos-green">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-naos-green border-t-transparent" />
                Uploading photo…
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-md bg-red-100 p-2.5 text-xs text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <p className="mt-2 text-sm text-naos-gray">
              Images will appear in the gallery for all verified members.
            </p>
          </div>
        )}

        {/* Load errors for non-uploaders */}
        {!canUpload && error && (
          <div className="mb-6 rounded-md bg-red-100 p-2.5 text-xs text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((event) => (
              <div
                key={event.id}
                className="rounded-lg overflow-hidden border border-naos-gray/30 bg-white hover:shadow-lg transition-shadow"
              >
                <img
                  src={event.photo}
                  alt={event.title || "Event photo"}
                  loading="lazy"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-naos-dark line-clamp-2">
                    {event.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-naos-gray mt-1">
                    {event.date
                      ? new Date(event.date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                      : "No date"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-naos-gray/30 bg-white p-12 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-naos-green/10 text-naos-green flex items-center justify-center text-xl">
              📸
            </div>
            <p className="text-sm text-naos-gray">
              No photos in the gallery yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
