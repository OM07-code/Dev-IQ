import { useState } from "react";

function OutputPanel({ output, stdin, setStdin }) {
  const [activeTab, setActiveTab] = useState("output");

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 bg-base-200 border-b border-base-300 text-sm flex items-end">
        <button 
           className={`px-4 py-2 font-semibold hover:text-primary transition-colors ${activeTab === 'output' ? 'text-primary border-b-2 border-primary' : 'text-base-content/60'}`}
           onClick={() => setActiveTab('output')}
        >
          Output
        </button>
        <button 
           className={`px-4 py-2 font-semibold hover:text-primary transition-colors ${activeTab === 'customInput' ? 'text-primary border-b-2 border-primary' : 'text-base-content/60'}`}
           onClick={() => setActiveTab('customInput')}
        >
          Custom Input (stdin)
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'output' ? (
          output === null ? (
            <p className="text-base-content/50 text-sm">Click "Run Code" to see the output here...</p>
          ) : output.success ? (
            <pre className="text-sm font-mono text-success whitespace-pre-wrap">{output.output}</pre>
          ) : (
            <div>
              {output.output && (
                <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                  {output.output}
                </pre>
              )}
              <pre className="text-sm font-mono text-error whitespace-pre-wrap">{output.error}</pre>
            </div>
          )
        ) : (
           <textarea
             className="textarea textarea-bordered w-full h-full font-mono bg-base-300 resize-none"
             placeholder="Enter multiple line strings or array formats here. These will be passed to stdin when running."
             value={stdin}
             onChange={(e) => setStdin(e.target.value)}
           ></textarea>
        )}
      </div>
    </div>
  );
}
export default OutputPanel;
