"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Email = {
  id: string;
  source: "axion" | "m&a" | "personal";
  sender: string;
  subject: string | null;
  snippet: string | null;
  unread: boolean | null;
  urgent: boolean | null;
};

const INBOXES = [
  { label: "Axion", value: "axion" },
  { label: "M&A", value: "m&a" },
  { label: "Personal", value: "personal" },
] as const;

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [activeInbox, setActiveInbox] =
    useState<Email["source"]>("axion");
  const [selectedEmail, setSelectedEmail] =
    useState<Email | null>(null);

  // 🔍 DEBUG ENV CHECK (TEMPORARY)
  useEffect(() => {
    console.log("====== ENV CHECK ======");
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL =",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY =",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log("isSupabaseConfigured =", isSupabaseConfigured);
    console.log("supabase instance =", supabase);
    console.log("=======================");
  }, []);

  async function loadEmails() {
    if (!supabase || !isSupabaseConfigured) {
      console.warn("Supabase not configured — skipping email load.");
      return;
    }

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("EMAIL LOAD ERROR:", error);
      return;
    }

    console.log("Loaded emails:", data);
    setEmails((data || []) as Email[]);
  }

  useEffect(() => {
    loadEmails();
  }, []);

  const visibleEmails = emails.filter(
    (email) => email.source === activeInbox
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>

      {/* Inbox Tabs */}
      <div className="flex gap-3">
        {INBOXES.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveInbox(tab.value);
              setSelectedEmail(null);
            }}
            className={`px-4 py-2 rounded border ${
              activeInbox === tab.value
                ? tab.value === "axion"
                  ? "border-orange-500 text-orange-400"
                  : tab.value === "m&a"
                  ? "border-blue-500 text-blue-400"
                  : "border-green-500 text-green-400"
                : "border-slate-600 text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Email List */}
        <div className="space-y-2">
          {visibleEmails.length === 0 && (
            <p className="text-slate-400">
              No emails in this inbox yet.
            </p>
          )}

          {visibleEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-3 border rounded cursor-pointer hover:bg-slate-900 ${
                selectedEmail?.id === email.id
                  ? "border-white"
                  : "border-slate-700"
              }`}
            >
              <div className="font-medium">
                {email.subject || "(No subject)"}
              </div>
              <div className="text-sm text-slate-400">
                {email.sender}
              </div>
              <div className="text-xs text-slate-500">
                {email.snippet || "No preview available."}
              </div>
            </div>
          ))}
        </div>

        {/* Email Viewer */}
        <div className="border rounded p-4 border-slate-700">
          {!selectedEmail && (
            <p className="text-slate-400">
              Select an email to view.
            </p>
          )}

          {selectedEmail && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                {selectedEmail.subject || "(No subject)"}
              </h2>
              <p className="text-sm text-slate-400">
                From: {selectedEmail.sender}
              </p>
              <p className="pt-2">
                {selectedEmail.snippet || "No preview available."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}