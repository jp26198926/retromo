"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export function MessageUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setError(data.error || "Failed to send message. Please try again.");
      }
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg text-left">
      {success && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Your message has been sent. We&apos;ll get back to you soon!
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-sm font-medium text-indigo-100"
          >
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-indigo-200/60 focus:border-white/40 focus:ring-2 focus:ring-white/30 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-sm font-medium text-indigo-100"
          >
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-indigo-200/60 focus:border-white/40 focus:ring-2 focus:ring-white/30 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-sm font-medium text-indigo-100"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you?"
            className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-indigo-200/60 focus:border-white/40 focus:ring-2 focus:ring-white/30 focus:outline-none"
          />
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-white-outline text-indigo-700 hover:bg-indigo-50 sm:w-auto"
          >
            {loading ? "Sending…" : "Send message"}
          </Button>
        </div>
      </div>
    </form>
  );
}
