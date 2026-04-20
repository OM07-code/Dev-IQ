import { XIcon, FileTextIcon, Code2Icon } from "lucide-react";

function ReviewModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-base-200">
        <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-200/50">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-primary">{session.problem}</span> 
              <span className="text-sm opacity-60">Review</span>
            </h2>
            <p className="text-sm opacity-60 mt-1">Interviewer: {session.host?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-base-content"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Notes Panel */}
          <div className="w-1/3 border-r border-base-200 flex flex-col bg-base-100">
            <div className="p-4 border-b border-base-200 flex items-center gap-2 font-semibold">
              <FileTextIcon className="w-4 h-4 text-warning" />
              Interviewer Notes
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap opacity-80">
              {session.notes || "No notes were taken during this session."}
            </div>
          </div>

          {/* Code Panel */}
          <div className="w-2/3 flex flex-col bg-base-300">
            <div className="p-4 border-b border-base-200 flex items-center gap-2 font-semibold bg-base-100">
              <Code2Icon className="w-4 h-4 text-primary" />
              Final Snapshot
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <pre className="font-mono text-sm w-full bg-black/30 p-4 rounded-xl text-green-400 overflow-x-auto">
                <code>{session.codeSnapshot || "// No code saved"}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;
