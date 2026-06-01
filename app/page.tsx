"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

type Screen = "password" | "poem" | "garden";

type SharedMemory = {
  id: number;
  created_at?: string;
  name: string;
  message: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
};

const basePhotos = Array.from(
  { length: 11 },
  (_, i) => `/meredith-${i + 1}.jpg`
);

const songs = [
  "/meredith1.mp3",
  "/meredith2.mp3",
  "/meredith3.mp3",
  "/meredith4.mp3",
  "/meredith5.mp3",
  "/meredith6.mp3",
  "/meredith7.mp3",
  "/meredith8.mp3",
  "/meredith9.mp3",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [screen, setScreen] = useState<Screen>("password");
  const [password, setPassword] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState("");

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [sharedMemories, setSharedMemories] = useState<SharedMemory[]>([]);
  const [currentMemory, setCurrentMemory] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const correctPassword = "light";

  const uploadedPhotos = sharedMemories
    .filter((memory) => memory.media_type === "image" && memory.media_url)
    .map((memory) => memory.media_url as string);

  const slideshowPhotos = [...basePhotos, ...uploadedPhotos];

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % slideshowPhotos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideshowPhotos.length]);

  useEffect(() => {
    if (currentPhoto >= slideshowPhotos.length) {
      setCurrentPhoto(0);
    }
  }, [currentPhoto, slideshowPhotos.length]);

  useEffect(() => {
    if (sharedMemories.length === 0) return;

    const timer = setInterval(() => {
      setCurrentMemory((prev) => (prev + 1) % sharedMemories.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [sharedMemories.length]);

  async function loadMemories() {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading memories:", error);
      return;
    }

    setSharedMemories(data || []);
  }

  function enterSite() {
    if (password.trim().toLowerCase() === correctPassword) {
      setScreen("poem");
    } else {
      alert("That password did not work.");
    }
  }

  function startMusic() {
    let randomSong = songs[Math.floor(Math.random() * songs.length)];

    if (songs.length > 1 && randomSong === currentSong) {
      const otherSongs = songs.filter((song) => song !== currentSong);
      randomSong = otherSongs[Math.floor(Math.random() * otherSongs.length)];
    }

    setCurrentSong(randomSong);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = randomSong;
        audioRef.current.volume = 0.35;
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }, 100);
  }

  function toggleMusic() {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      if (!currentSong) {
        startMusic();
      } else {
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (file.type.startsWith("video")) {
      setFileType("video");
    } else {
      setFileType("image");
    }
  }

  async function submitMemory() {
    if (!name.trim() && !message.trim() && !selectedFile) {
      alert("Please add a name, memory, photo, or video.");
      return;
    }

    setIsSubmitting(true);

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    if (selectedFile) {
      mediaType = selectedFile.type.startsWith("video") ? "video" : "image";

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const filePath = `user-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("memories")
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("The photo or video could not upload.");
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage
        .from("memories")
        .getPublicUrl(filePath);

      mediaUrl = data.publicUrl;
    }

    const { error } = await supabase.from("memories").insert([
      {
        name: name.trim() || "Anonymous",
        message: message.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        approved: false,
      },
    ]);

    if (error) {
      console.error("Memory save error:", error);
      alert("Unable to save memory.");
      setIsSubmitting(false);
      return;
    }

    alert("Thank you for sharing. Your memory has been submitted for approval.");

    setName("");
    setMessage("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setCurrentMemory(0);
    setIsSubmitting(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8efe7] text-[#4b3f3a]">
      <audio ref={audioRef} loop />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,_#f6d8cf,_transparent_35%),radial-gradient(circle_at_bottom_right,_#d9c7ee,_transparent_35%),linear-gradient(135deg,_#fff8ef,_#f4e5dc,_#eee2f4)]" />

      {screen === "password" && (
        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/55 p-8 text-center shadow-2xl backdrop-blur-md">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enterSite()}
              className="mb-5 w-full rounded-full border border-[#c9a2a8] bg-white/70 px-5 py-4 text-center outline-none ring-[#b07c82]/30 focus:ring-4"
            />

            <button
              onClick={enterSite}
              className="rounded-full bg-[#b07c82] px-8 py-4 text-white shadow-lg transition hover:bg-[#96656a]"
            >
              Enter
            </button>
          </div>
        </section>
      )}

      {screen === "poem" && (
        <section className="relative z-10 flex min-h-screen items-start justify-center px-6 pt-0 pb-10 text-center">
          <div className="w-full max-w-3xl">
            <h1 className="mb-4 font-serif text-4xl italic leading-[1.15] text-[#9b6f72] md:text-6xl">
              Deep breath in...
              <br />
              now out...
              <br />
              let us begin.
            </h1>

            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d8c2b5] bg-[#f5ede4] px-10 py-7 shadow-2xl md:px-16">
              <p className="whitespace-pre-line font-serif text-[17px] italic leading-7 text-[#544844] md:text-xl">
{`I am not there. I do not sleep.
I am a thousand winds that blow.
I am the diamond glints on snow.
I am the sunlight on ripened grain.
I am the gentle autumn rain.

When you awaken in the morning's hush
I am the swift uplifting rush
Of quiet birds in circled flight.
I am the soft stars that shine at night.

Do not stand at my grave and cry;
I am not there. I did not die.`}
              </p>

              <p className="mt-3 text-sm italic text-[#8b6f68]">
                — Mary Elizabeth Frye
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setScreen("garden");
                  startMusic();
                }}
                className="rounded-full bg-[#b07c82] px-8 py-4 text-white shadow-lg transition hover:bg-[#96656a]"
              >
                Continue
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === "garden" && (
        <section className="relative z-10 px-6 py-20">
{/* Dandelion */}
<img
  src="/dandelion1.png"
  alt=""
  className="pointer-events-none fixed left-[-20px] top-[400px] z-0 w-[950px] opacity-55"
/>

{/* Floating Seeds */}
<img
  src="/dandelion2.png"
  alt=""
  className="pointer-events-none fixed left-[1250px] top-[50px] z-0 w-[400px] opacity-35 animate-seedFloat"/>
          <button
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-white/80 px-5 py-3 text-sm text-[#4b3f3a] shadow-lg backdrop-blur-md transition hover:bg-white"
          >

            {isMusicPlaying ? "⏸ Pause Music" : "▶ Play Music"}
          </button>

          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="mb-5 flex flex-col items-center">
                <div className="mb-4 h-px w-32 bg-[#c8a8ac]/40" />

                <h1 className="font-serif text-5xl italic text-[#8f5f66] md:text-7xl">
                  Echoes and Whispers
                </h1>

                <div className="mt-4 h-px w-32 bg-[#c8a8ac]/40" />
              </div>

              <p className="mx-auto max-w-3xl font-serif text-2xl italic leading-9 text-[#8b6f68]">
                Through the lens of love, we see into the windows of memory.
              </p>
            </div>

            <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-white/70 bg-white/60 p-5 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => setSelectedPhoto(slideshowPhotos[currentPhoto])}
                className="group relative block w-full overflow-hidden rounded-[2rem]"
              >
                <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#efe6df] p-6">
                  <img
                    key={slideshowPhotos[currentPhoto]}
                    src={slideshowPhotos[currentPhoto]}
                    alt="Meredith memory"
                    className="h-full max-h-[360px] w-auto max-w-full rounded-[1rem] object-contain transition duration-700 group-hover:scale-[1.02]"
                  />
                </div>
              </button>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {slideshowPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhoto(index)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      currentPhoto === index
                        ? "bg-[#9b6f72]"
                        : "bg-[#c8a8ac]/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-2xl backdrop-blur-md">
              <h2 className="mb-4 font-serif text-3xl italic text-[#8f5f66]">
                Memory Spotlight
              </h2>

              {sharedMemories.length > 0 ? (
                <>
                  <p className="font-serif text-2xl italic leading-9 text-[#4f433f]">
                    “
                    {sharedMemories[currentMemory]?.message ||
                      "A memory shared in love."}
                    ”
                  </p>

                  <p className="mt-5 text-sm uppercase tracking-[0.25em] text-[#8b6f68]">
                    — {sharedMemories[currentMemory]?.name || "Anonymous"}
                  </p>
                </>
              ) : (
                <p className="font-serif text-xl italic leading-8 text-[#75635d]">
                  Approved memories will gently appear in this space.
                </p>
              )}
            </div>

            <div className="mx-auto mt-20 max-w-4xl rounded-[2rem] border border-white/70 bg-white/60 p-10 text-center shadow-2xl backdrop-blur-md">
              <h2 className="mb-4 font-serif text-4xl text-[#3f3430]">
                Share a Memory
              </h2>

              <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[#75635d]">
                Please share a memory of Meredith.
                <br />
                Together, we keep her light glowing through memory and love.
              </p>

              <div className="mx-auto grid max-w-2xl gap-4 text-left">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-2xl border border-[#d8c2b5] bg-white/70 px-5 py-4 outline-none focus:ring-4 focus:ring-[#b07c82]/20"
                />

                <textarea
                  placeholder="Write a memory..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="rounded-2xl border border-[#d8c2b5] bg-white/70 px-5 py-4 outline-none focus:ring-4 focus:ring-[#b07c82]/20"
                />

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="rounded-2xl border border-[#d8c2b5] bg-white/70 px-5 py-4 text-[#75635d]"
                />

                {previewUrl && (
                  <div className="rounded-2xl bg-[#efe6df] p-4 text-center">
                    {fileType === "video" ? (
                      <video
                        src={previewUrl}
                        controls
                        className="mx-auto max-h-64 rounded-xl"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="mx-auto max-h-64 rounded-xl object-contain"
                      />
                    )}
                  </div>
                )}

                <button
                  onClick={submitMemory}
                  disabled={isSubmitting}
                  className="mx-auto mt-3 rounded-full bg-[#b07c82] px-10 py-4 text-white shadow-lg transition hover:bg-[#96656a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Add Memory"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-6 top-6 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-md transition hover:bg-white/30"
          >
            Close
          </button>

          <img
            src={selectedPhoto}
            alt="Expanded Meredith memory"
            className="max-h-[92vh] max-w-[92vw] rounded-[1rem] object-contain shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}