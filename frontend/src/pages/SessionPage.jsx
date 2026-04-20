import { useAuth } from "../context/AuthContext.jsx";
import { socket } from "../lib/socket.js";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById, useUpdateSessionState } from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { CopyIcon, Loader2Icon, LogOutIcon, PhoneOffIcon, PlusIcon, XIcon, ChevronDownIcon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import PrivateNotesPanel from "../components/PrivateNotesPanel";
import WhiteboardPanel from "../components/WhiteboardPanel";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";


function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");
  const [stdin, setStdin] = useState("");
  const [showAddProblem, setShowAddProblem] = useState(false);

  // Multi-problem state
  const [problemsList, setProblemsList] = useState([]);
  const [activeProblem, setActiveProblem] = useState(""); // the problem title currently active
  const codeMapRef = useRef({}); // problemTitle -> { code, language }

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();
  const updateSessionStateMutation = useUpdateSessionState();

  const session = sessionData?.session;
  const isHost = session?.host?._id === user?._id;
  const isParticipant = session?.participant?._id === user?._id;

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // Derive current problem data from activeProblem title
  const problemData = activeProblem
    ? Object.values(PROBLEMS).find((p) => p.title === activeProblem)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  // Seed problemsList from session data once loaded
  useEffect(() => {
    if (!session || loadingSession) return;
    const list = session.problemsList?.length ? session.problemsList : [session.problem];
    const active = session.activeProblem || session.problem;
    setProblemsList(list);
    setActiveProblem(active);
    // seed code for the active problem if not already in map
    if (!codeMapRef.current[active]) {
      const pd = Object.values(PROBLEMS).find((p) => p.title === active);
      const starter = pd?.starterCode?.[selectedLanguage] || "";
      codeMapRef.current[active] = { code: starter, language: selectedLanguage };
    }
    const snapshot = codeMapRef.current[active];
    setCode(snapshot?.code || "");
    setSelectedLanguage(snapshot?.language || "javascript");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id]);

  // auto-join session if user is not already a participant and not the host
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;
    joinSessionMutation.mutate(id, { onSuccess: refetch });
    // remove the joinSessionMutation, refetch from dependencies to avoid infinite loop
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // initialize WebSockets for real-time code sync
  useEffect(() => {
    if (!session || (!isHost && !isParticipant)) return;

    socket.connect();
    socket.emit("join-room", id);

    const handleCodeUpdate = (newCode) => setCode(newCode);
    const handleLanguageUpdate = (newLang) => setSelectedLanguage(newLang);
    const handleStdinUpdate = (newStdin) => setStdin(newStdin);
    const handleOutputUpdate = ({ output: newOutput, isRunning: newIsRunning }) => {
      setOutput(newOutput);
      setIsRunning(newIsRunning);
    };
    const handleProblemsUpdated = ({ problemsList: newList, activeProblem: newActive }) => {
      setProblemsList(newList);
      switchToActiveProblem(newActive, false);
    };
    const handleProblemSwitched = (newActive) => {
      switchToActiveProblem(newActive, false);
    };

    socket.on("code-update", handleCodeUpdate);
    socket.on("language-update", handleLanguageUpdate);
    socket.on("stdin-update", handleStdinUpdate);
    socket.on("output-update", handleOutputUpdate);
    socket.on("problems-updated", handleProblemsUpdated);
    socket.on("problem-switched", handleProblemSwitched);

    return () => {
      socket.off("code-update", handleCodeUpdate);
      socket.off("language-update", handleLanguageUpdate);
      socket.off("stdin-update", handleStdinUpdate);
      socket.off("output-update", handleOutputUpdate);
      socket.off("problems-updated", handleProblemsUpdated);
      socket.off("problem-switched", handleProblemSwitched);
      socket.disconnect();
    };
  }, [session, isHost, isParticipant, id]);

  // Toast notification when Candidate joins
  useEffect(() => {
    if (isHost && session?.participant) {
      toast.success("Candidate has joined the session!");
    }
  }, [session?.participant, isHost]);

  // Save current code/lang to the codeMap before switching problems
  const saveCurrentToMap = () => {
    if (activeProblem) {
      codeMapRef.current[activeProblem] = { code, language: selectedLanguage };
    }
  };

  // Switch to a problem by title (local state only, no emit)
  const switchToActiveProblem = (problemTitle, shouldEmit = true) => {
    saveCurrentToMap();
    setActiveProblem(problemTitle);
    const pd = Object.values(PROBLEMS).find((p) => p.title === problemTitle);
    const snapshot = codeMapRef.current[problemTitle];
    const lang = snapshot?.language || "javascript";
    const newCode = snapshot?.code ?? pd?.starterCode?.[lang] ?? "";
    setSelectedLanguage(lang);
    setCode(newCode);
    setOutput(null);
    if (shouldEmit) {
      socket.emit("switch-problem", { sessionId: id, activeProblem: problemTitle });
      updateSessionStateMutation.mutate({ id, newActiveProblem: problemTitle });
      // sync code for the new problem
      socket.emit("code-change", { sessionId: id, code: newCode });
      socket.emit("language-change", { sessionId: id, language: lang });
    }
  };

  // Interviewer: add a new problem to the session
  const handleAddProblem = (problem) => {
    if (problemsList.includes(problem.title)) {
      toast.error("Problem already added");
      return;
    }
    saveCurrentToMap();
    const newList = [...problemsList, problem.title];
    setProblemsList(newList);
    // Initialize code map for new problem
    codeMapRef.current[problem.title] = {
      code: problem.starterCode?.[selectedLanguage] || "",
      language: selectedLanguage,
    };
    setShowAddProblem(false);

    // persist & broadcast
    updateSessionStateMutation.mutate({ id, problemToAdd: problem.title, newActiveProblem: problem.title });
    socket.emit("add-problem", { sessionId: id, problemsList: newList, activeProblem: problem.title });

    // Switch to the newly added problem
    switchToActiveProblem(problem.title, false);
    toast.success(`"${problem.title}" added to session!`);
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-change", { sessionId: id, code: value });
  };

  const handleStdinChange = (value) => {
    setStdin(value);
    socket.emit("stdin-change", { sessionId: id, stdin: value });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    const starterCode = problemData?.starterCode?.[newLang] || "";
    setCode(starterCode);
    setOutput(null);
    socket.emit("language-change", { sessionId: id, language: newLang });
    socket.emit("code-change", { sessionId: id, code: starterCode });
    socket.emit("output-change", { sessionId: id, output: null, isRunning: false });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    socket.emit("output-change", { sessionId: id, output: null, isRunning: true });
    const result = await executeCode(selectedLanguage, code, stdin);
    setOutput(result);
    setIsRunning(false);
    socket.emit("output-change", { sessionId: id, output: result, isRunning: false });
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      endSessionMutation.mutate({ id, codeSnapshot: code }, { onSuccess: () => navigate("/dashboard") });
    }
  };

  // All available problems NOT already in the session
  const availableProblems = Object.values(PROBLEMS).filter((p) => !problemsList.includes(p.title));



  return (
    <div className="h-screen bg-base-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* TOP GLOBAL SESSION TOOLBAR */}
      <div className="px-6 py-2 bg-base-200 border-b border-base-300 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-base-content">{session?.problem || "Loading..."}</h1>
          {session && (
            <span className={`badge ${isHost ? 'badge-primary' : 'badge-secondary'}`}>
              {isHost ? 'Interviewer' : 'Candidate'}
            </span>
          )}
          <span className={`badge badge-outline ${getDifficultyBadgeClass(session?.difficulty)}`}>
            {session?.difficulty?.charAt(0).toUpperCase() + session?.difficulty?.slice(1) || "Easy"}
          </span>
          {problemData?.category && (
            <span className="text-sm text-base-content/60 border-l border-base-300 pl-4">{problemData.category}</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-base-content/70 flex items-center gap-2">
            {isHost ? "Interviewing:" : "Interviewer:"} 
            <span className="font-semibold text-primary">
              {isHost ? session?.participant?.name || "Waiting..." : session?.host?.name || "Loading..."}
            </span>
            <span className="text-base-content/40">|</span>
            <span>{session?.participant ? 2 : 1}/2 joined</span>
          </div>

          {!session?.participant && isHost && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Invite link copied to clipboard!");
              }}
              className="btn btn-secondary btn-sm gap-2"
            >
              <CopyIcon className="w-4 h-4" />
              Copy Invite
            </button>
          )}

          {isHost && session?.status === "active" && (
            <button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="btn btn-error btn-sm gap-2"
            >
              {endSessionMutation.isPending ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <LogOutIcon className="w-4 h-4" />
              )}
              End Session
            </button>
          )}

          {session?.status === "completed" && (
            <span className="badge badge-ghost">Completed</span>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <PanelGroup direction="horizontal" className="rounded-xl border border-base-300 overflow-hidden shadow-sm">
          {/* 1. LEFTMOST PANEL - VIDEO CALL */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-base-200">
               {isInitializingCall ? (
                 <div className="h-full flex items-center justify-center">
                   <div className="text-center">
                     <Loader2Icon className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
                     <p className="text-sm text-base-content/70">Connecting video...</p>
                   </div>
                 </div>
               ) : !streamClient || !call ? (
                 <div className="h-full flex items-center justify-center p-4">
                   <div className="text-center">
                     <PhoneOffIcon className="w-8 h-8 mx-auto text-error mb-2" />
                     <p className="text-sm text-base-content/70">Video Failed</p>
                   </div>
                 </div>
               ) : (
                 <StreamVideo client={streamClient}>
                   <StreamCall call={call}>
                     <VideoCallUI chatClient={chatClient} channel={channel} />
                   </StreamCall>
                 </StreamVideo>
               )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* 2. MIDDLE PANEL - PROBLEM INFO & WHITEBOARD */}
          <Panel defaultSize={30} minSize={20}>
            <div className="h-full flex flex-col bg-base-100">

              {/* PROBLEM SWITCHER BAR */}
              <div className="bg-base-200 border-b border-base-300 px-3 py-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {problemsList.map((title, idx) => {
                    const pd = Object.values(PROBLEMS).find((p) => p.title === title);
                    return (
                      <button
                        key={title}
                        onClick={() => isHost ? switchToActiveProblem(title) : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          activeProblem === title
                            ? "bg-primary text-primary-content border-primary"
                            : "bg-base-100 border-base-300 hover:border-primary/50 text-base-content/70"
                        } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className="opacity-60">Q{idx + 1}</span>
                        <span className="max-w-[100px] truncate">{title}</span>
                        {pd && (
                          <span className={`ml-1 ${
                            pd.difficulty === 'Easy' ? 'text-success' :
                            pd.difficulty === 'Medium' ? 'text-warning' : 'text-error'
                          }`}>•</span>
                        )}
                      </button>
                    );
                  })}
                  {isHost && (
                    <button
                      onClick={() => setShowAddProblem(true)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-all"
                    >
                      <PlusIcon className="size-3" /> Add Problem
                    </button>
                  )}
                </div>
              </div>

              {/* VIEW TABS */}
              <div className="flex border-b border-base-300 bg-base-200 shrink-0">
                <button 
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'problem' ? 'text-primary border-b-2 border-primary bg-base-100' : 'text-base-content/60 hover:text-base-content'}`}
                  onClick={() => setActiveTab('problem')}
                >
                  Problem
                </button>
                {isHost && (
                  <button 
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'notes' ? 'text-warning border-b-2 border-warning bg-base-100' : 'text-base-content/60 hover:text-base-content'}`}
                    onClick={() => setActiveTab('notes')}
                  >
                    Private Notes
                  </button>
                )}
                <button 
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'whiteboard' ? 'text-info border-b-2 border-info bg-base-100' : 'text-base-content/60 hover:text-base-content'}`}
                  onClick={() => setActiveTab('whiteboard')}
                >
                  Whiteboard
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                {activeTab === "problem" ? (
                  <div className="p-4 space-y-6">
                    {/* problem desc */}
                    {problemData?.description && (
                      <div>
                        <h2 className="font-bold mb-2 text-base-content">Description</h2>
                        <div className="space-y-3 text-sm leading-relaxed text-base-content/90">
                          <p>{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx}>{note}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* examples section */}
                    {problemData?.examples && problemData.examples.length > 0 && (
                      <div>
                        <h2 className="font-bold mb-2 text-base-content">Examples</h2>
                        <div className="space-y-3">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx} className="bg-base-200 rounded p-3 font-mono text-xs space-y-1">
                              <div className="flex gap-2">
                                <span className="text-primary font-bold">Input:</span>
                                <span>{example.input}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-secondary font-bold">Output:</span>
                                <span>{example.output}</span>
                              </div>
                              {example.explanation && (
                                <div className="pt-1 mt-1 border-t border-base-300 font-sans text-base-content/60">
                                  <span className="font-semibold">Explanation:</span> {example.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Constraints */}
                    {problemData?.constraints && problemData.constraints.length > 0 && (
                      <div>
                        <h2 className="font-bold mb-2 text-base-content">Constraints</h2>
                        <ul className="space-y-1 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2 text-xs">
                              <span className="text-primary">•</span>
                              <code>{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : activeTab === "notes" ? (
                  <PrivateNotesPanel sessionId={id} initialNotes={session?.notes || ""} />
                ) : (
                  <WhiteboardPanel sessionId={id} />
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* 3. RIGHTMOST PANEL - CODE & OUTPUT */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  code={code}
                  isRunning={isRunning}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={handleCodeChange}
                  onRunCode={handleRunCode}
                />
              </Panel>

              <PanelResizeHandle className="h-1 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={30} minSize={15}>
                <OutputPanel output={output} stdin={stdin} setStdin={handleStdinChange} />
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>

      {/* ADD PROBLEM MODAL - Host Only */}
      {showAddProblem && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-base-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-base-200 border-b border-base-300">
              <div>
                <h2 className="text-xl font-bold text-base-content">Add Problem to Session</h2>
                <p className="text-sm text-base-content/60 mt-0.5">Select a problem to push to the candidate</p>
              </div>
              <button
                onClick={() => setShowAddProblem(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Problem List */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {availableProblems.length === 0 ? (
                <div className="text-center py-10 text-base-content/50">
                  <p className="text-lg font-semibold">All problems added!</p>
                  <p className="text-sm">No more problems available to add.</p>
                </div>
              ) : (
                availableProblems.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => handleAddProblem(problem)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-base-200 hover:bg-base-300 border border-base-300 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base-content group-hover:text-primary transition-colors">
                          {problem.title}
                        </span>
                        <span className={`badge badge-sm ${
                          problem.difficulty === 'Easy' ? 'badge-success' :
                          problem.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60">{problem.category}</p>
                      <p className="text-xs text-base-content/50 mt-1 truncate">{problem.description?.text?.slice(0, 80)}...</p>
                    </div>
                    <PlusIcon className="size-5 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionPage;
