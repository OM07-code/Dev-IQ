import { useEffect, useState } from "react";
import { SaveIcon, FileTextIcon } from "lucide-react";
import { useUpdateNotes } from "../hooks/useSessions";

function PrivateNotesPanel({ sessionId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isTyping, setIsTyping] = useState(false);
  const updateNotesMutation = useUpdateNotes();

  // Handle autosave with debounce
  useEffect(() => {
    if (notes === initialNotes) return;

    setIsTyping(true);
    const timeoutId = setTimeout(() => {
      updateNotesMutation.mutate({ id: sessionId, notes }, {
        onSuccess: () => setIsTyping(false),
      });
    }, 2000); // Autosave 2 seconds after typing stops

    return () => clearTimeout(timeoutId);
  }, [notes, sessionId, initialNotes]);

  return (
    <div className="h-full bg-base-100 flex flex-col border-l border-base-300 shadow-xl">
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <FileTextIcon className="w-4 h-4" />
          <span>Interviewer Notes (Private)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          {updateNotesMutation.isPending || isTyping ? (
            <span className="flex items-center gap-1 text-warning">
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-success">
              <SaveIcon className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-4">
        <textarea
          className="textarea textarea-bordered w-full h-full bg-base-200 resize-none font-mono"
          placeholder="Jot down behavioral observations, algorithm logic traces, and final grading here. This is hidden from the candidate."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}

export default PrivateNotesPanel;
