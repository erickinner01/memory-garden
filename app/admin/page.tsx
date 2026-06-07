"use client";

import { useState } from "react";

type Memory = {
  id: number;
  name: string;
  message: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  approved: boolean;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!password.trim()) {
      alert("Enter the admin password.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/memories", {
      headers: {
        "x-admin-password": password,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Admin login failed.");
      setLoading(false);
      return;
    }

    setAdminPassword(password);
    setMemories(result.memories || []);
    setLoading(false);
  }

  async function loadMemories() {
    const res = await fetch("/api/admin/memories", {
      headers: {
        "x-admin-password": adminPassword,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Could not load memories.");
      return;
    }

    setMemories(result.memories || []);
  }

  async function approveMemory(id: number) {
    const res = await fetch("/api/admin/memories", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Could not approve memory.");
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

    const res = await fetch("/api/admin/memories", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Could not delete memory.");
      return;
    }

    alert("Memory deleted.");
    loadMemories();
  }

  if (!adminPassword) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8efe7] px-6 text-[#4b3f3a]">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
          <h1 className="mb-6 font-serif text-4xl text-[#8f5f66]">
            Admin Login
          </h1>

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className="mb-5 w-full rounded-full border border-[#d8c2b5] px-5 py-4 text-center outline-none focus:ring-4 focus:ring-[#b07c82]/20"
          />

          <button
            onClick={login}
            disabled={loading}
            className="rounded-full bg-[#b07c82] px-8 py-4 text-white shadow-lg transition hover:bg-[#96656a] disabled:opacity-60"
          >
            {loading ? "Checking..." : "Enter Admin"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8efe7] p-10 text-[#4b3f3a]">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 font-serif text-5xl text-[#8f5f66]">
          Memory Admin
        </h1>

        {memories.length === 0 && (
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