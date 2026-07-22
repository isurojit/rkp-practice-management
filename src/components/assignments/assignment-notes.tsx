"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { AssignmentNote } from "@/types/assignment-note";

interface AssignmentNotesProps {
  notes: AssignmentNote[];
  onAddNote: (note: string) => Promise<void>;
}

function formatCreatedAt(value: unknown) {
  if (!value) return "";

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toLocaleString();
  }

  const date = new Date(value as string | number | Date);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export default function AssignmentNotes({
  notes,
  onAddNote,
}: AssignmentNotesProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      setError("Please enter an internal note.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onAddNote(trimmedNote);

      setNote("");
    } catch (submitError) {
      console.error("Failed to add assignment note:", submitError);
      setError("Failed to add note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    const getTime = (value: unknown) => {
      if (
        typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof (value as { toDate?: unknown }).toDate === "function"
      ) {
        return (
          value as {
            toDate: () => Date;
          }
        )
          .toDate()
          .getTime();
      }

      const date = new Date(value as string | number | Date);

      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    return getTime(b.createdAt) - getTime(a.createdAt);
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <MessageSquareText size={21} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">Internal Notes</h2>

          <p className="text-sm text-slate-500">
            Record internal instructions, follow-ups and management remarks.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
        <Textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);

            if (error) {
              setError("");
            }
          }}
          placeholder="Add an internal note for this assignment..."
          className="min-h-28 resize-y border-white bg-white/90"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 rounded-xl bg-sky-600 hover:bg-sky-700"
          >
            <Send size={16} />

            {saving ? "Adding Note..." : "Add Note"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sortedNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white/50 px-5 py-8 text-center text-sm text-slate-500">
            No internal notes have been added yet.
          </div>
        ) : (
          sortedNotes.map((item, index) => (
            <motion.article
              key={item.id ?? `${item.createdAt}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.03,
              }}
              className="rounded-2xl border border-sky-100 bg-white/85 p-4"
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {item.note}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>{item.createdByName || "Unknown User"}</span>

                <span>{formatCreatedAt(item.createdAt)}</span>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </motion.section>
  );
}
