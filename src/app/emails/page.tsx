"use client";

import { useEffect, useState } from "react";

type Email = {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  unread: boolean;
  urgent: boolean;
  intent: string | null;
  suggested_action: string | null;
  source: "axion" | "m&a" | "personal";
};

const SOURCE_COLORS: Record<string, string> = {
  axion: "border-orange-500 text-orange-400",
  "m&a": "border-blue-500 text-blue-400",
  personal: "border-green-500 text-green-400",
};

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);

  useEffect(() => {
    fetch("/api/emails")
      .then((res) => res.json())
      .then((data) => setEmails(data.emails));
  }, []);

  const grouped = {
    axion: emails.filter((e) => e.source === "axion"),
    "m&a": emails.filter((e) => e.source === "m&a"),
    personal: emails.filter((e) => e.source === "personal"),
  };

  return (
    <div className="flex h-full p-4 gap-4">
      {/* LEFT PANEL */}
      <div className="flex gap-4 w-2/3">
        {Object.entries(grouped).map(([source, list]) => (
          <div key={source} className="flex-1">
            <h2 className={`mb-2 font-bold uppercase ${SOURCE_COLORS[source]}`}>
              {source} ({list.length})
            </h2>

            <div className="space-y-2 overflow-y-auto max-h-[75vh] pr-1">
              {list.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelected(email)}
                  className={`cursor-pointer border rounded p-3 hover:bg-slate-800 ${
                    selected?.id === email.id
                      ? "border-white"
                      : SOURCE_COLORS[source]
                  }`}
                >
                  <div className="font-semibold">{email.subject}</div>
                  <div className="text-xs opacity-70">{email.sender}</div>

                  <div className="flex gap-2 mt-1 text-xs">
                    {email.unread && (
                      <span className="px-2 py-0.5 bg-yellow-600 rounded">
                        Unread
                      </span>
                    )}
                    {email.urgent && (
                      <span className="px-2 py-0.5 bg-red-600 rounded">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 border rounded p-4 bg-slate-900">
        {!selected ? (
          <div className="opacity-50">Select an email to view</div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2">{selected.subject}</h2>
            <div className="text-sm opacity-70 mb-4">
              From: {selected.sender}
            </div>

            <p className="mb-4">{selected.snippet}</p>

            <div className="text-xs space-y-1">
              <div>Unread: {String(selected.unread)}</div>
              <div>Urgent: {String(selected.urgent)}</div>
              <div>Intent: {selected.intent ?? "None"}</div>
              <div>
                Suggested Action: {selected.suggested_action ?? "None"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}