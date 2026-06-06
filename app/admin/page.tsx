"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Memory = {
  id: number;
  name: string;
  message: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  approved: boolean;
};

export default function AdminPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);

    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load Error:", error);
      alert(`Load Error: ${error.message}`);
    }

    setMemories(data || []);
    setLoading(false);
  }

  async function approveMemory(id: number) {
    console.log("Approving memory:", id);

    const { error } = await supabase
      .from("memories")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      console.error("Approve Error:", error);
      alert(`Approve Error: ${error.message}`);
      return;
    }

    alert("Memory approved.");
    loadMemories();
  }

  async function deleteMemory(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this memory?"
    );

    if (!confirmed) return;

    console.log("Deleting memory:", id);

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete Error:", error);
      alert(`Delete Error: ${error.message}`);
      return;
    }

    alert("Memory deleted.");
    loadMemories();
  }

  return (
    <main className="min-h-screen bg-[#f8efe7] p-10 text-[#4b3f3a]">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 font-serif text-5xl text-[#8f5f66]">
          Memory Admin
        </h1>

        {loading && (
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            Loading memories...
          </div>
        )}

        {!loading && memories.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            No memories found.
          </div>
        )}

        <div className="space-y-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="rounded-3xl bg-white p-6 text-[#4b3f3a] shadow-lg"
            >
              {memory.media_url && memory.media_type === "image" && (
                <img
                  src={memory.media_url}
                  alt="Memory upload"
                  className="mb-4 max-h-80 rounded-2xl object-contain"
                />
              )}

              {memory.media_url && memory.media_type === "video" && (
                <video
                  src={memory.media_url}
                  controls
                  className="mb-4 max-h-80 rounded-2xl"
                />
              )}

              <h2 className="text-2xl font-semibold">
                {memory.name || "Anonymous"}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-lg">
                {memory.message}
              </p>

              <p className="mt-4">
                Status:
                <span
                  className={
                    memory.approved
                      ? "ml-2 font-semibold text-green-600"
                      : "ml-2 font-semibold text-orange-600"
                  }
                >
                  {memory.approved ? "Approved" : "Pending"}
                </span>
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {!memory.approved && (
                  <button
                    onClick={() => approveMemory(memory.id)}
                    className="rounded-full bg-green-600 px-5 py-2 text-white transition hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}

                <button
                  onClick={() => deleteMemory(memory.id)}
                  className="rounded-full bg-red-600 px-5 py-2 text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}