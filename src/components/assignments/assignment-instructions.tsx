"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { AssignmentInstruction } from "@/types/assignment-instruction";

interface AssignmentInstructionsProps {
  instructions: AssignmentInstruction[];
  onAddInstruction: (instruction: string) => Promise<void>;
  canAddInstruction: boolean;
}

function getTimestamp(value: unknown): number {
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
}

function formatDate(value: unknown): string {
  const timestamp = getTimestamp(value);

  return timestamp ? new Date(timestamp).toLocaleString() : "";
}

export default function AssignmentInstructions({
  instructions,
  onAddInstruction,
  canAddInstruction,
}: AssignmentInstructionsProps) {
  const [instruction, setInstruction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedInstructions = [...instructions].sort(
    (first, second) =>
      getTimestamp(second.createdAt) - getTimestamp(first.createdAt),
  );

  const handleSubmit = async () => {
    const cleanedInstruction = instruction.trim();

    if (!cleanedInstruction) {
      setError("Please enter an instruction.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onAddInstruction(cleanedInstruction);

      setInstruction("");
    } catch (submitError) {
      console.error("Failed to add instruction:", submitError);
      setError("Failed to add instruction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          <ClipboardList size={21} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Assignment Instructions
          </h2>

          <p className="text-sm text-slate-500">
            Instructions and information visible to the assigned team.
          </p>
        </div>
      </div>

      {canAddInstruction && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <Textarea
            value={instruction}
            onChange={(event) => {
              setInstruction(event.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Add an instruction for the assigned employees..."
            className="min-h-28 resize-y border-white bg-white/90"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700"
            >
              <Send size={16} />

              {saving ? "Adding..." : "Add Instruction"}
            </Button>
          </div>
        </div>
      )}

      <div className={canAddInstruction ? "mt-6 space-y-3" : "space-y-3"}>
        {sortedInstructions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/50 px-5 py-8 text-center text-sm text-slate-500">
            No assignment instructions have been added.
          </div>
        ) : (
          sortedInstructions.map((item, index) => (
            <motion.article
              key={item.id ?? `${index}-${item.instruction}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-cyan-100 bg-white/85 p-4"
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {item.instruction}
              </p>

              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
                <span>{item.createdByName || "Unknown User"}</span>

                <span>{formatDate(item.createdAt)}</span>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </motion.section>
  );
}
