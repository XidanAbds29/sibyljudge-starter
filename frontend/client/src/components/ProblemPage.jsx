// frontend/client/src/components/ProblemPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client Initialization ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  // console.log("ProblemPage: Supabase client initialized.");
} else {
  console.error("ProblemPage: Supabase URL or Key is missing. Check .env file and VITE_ prefix.");
}
// --- End Supabase Client Initialization ---

const TABS = [
  "Statement",
  "Input",
  "Output",
  "Examples",
  "Submissions",
  "Test Runner",
];
const LANGUAGES = [
  { id: "cpp", name: "C++ (GCC 11)", template: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}", monacoLang: "cpp" },
  { id: "python", name: "Python 3.10", template: "# Your Python solution here\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()", monacoLang: "python" },
  { id: "java", name: "Java 17", template: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}", monacoLang: "java" },
];

// --- Helper Components ---

function SampleTest({ input, output }) {
  const [copied, setCopied] = useState(null); 
  const copyToClipboard = (text, type) => {
    const textToCopy = String(text || "").replace(/\n{3,}/g, "\n\n").trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      }).catch(err => {
        console.error('Failed to copy with navigator.clipboard: ', err);
        fallbackCopyToClipboard(textToCopy, type);
      });
    } else {
      fallbackCopyToClipboard(textToCopy, type);
    }
  };

  const fallbackCopyToClipboard = (text, type) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.top = "-9999px"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try {
      document.execCommand('copy');
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) { console.error('Fallback execCommand copy failed: ', err); }
    document.body.removeChild(textArea);
  };

  const formatSampleText = (text) => {
    text = String(text || "");
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mb-6 bg-gray-800/40 rounded-xl border border-cyan-700/50 overflow-hidden hover:border-cyan-500/70 transition-all duration-300 group relative shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/15 via-sky-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-cyan-700/40 relative">
        <div className="p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-cyan-400 font-semibold flex items-center gap-2 tracking-wider text-sm uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Input</h3>
            <button onClick={() => copyToClipboard(formatSampleText(input), "input")} className="px-3 py-1 text-xs rounded-md bg-cyan-600 text-gray-950 hover:bg-cyan-400 font-medium transition-all duration-300 flex items-center gap-1 shadow hover:shadow-md">
              {copied === "input" ? (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Copied!</>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy</>)}</button>
          </div>
          <pre className="whitespace-pre-wrap font-mono bg-gray-950/70 p-3 rounded-md border border-gray-700/70 group-hover:border-cyan-600/60 transition-all duration-300 text-xs sm:text-sm leading-relaxed text-gray-300 min-h-[60px] max-h-[200px] overflow-y-auto">
            {formatSampleText(input)}
          </pre>
        </div>
        <div className="p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-cyan-400 font-semibold flex items-center gap-2 tracking-wider text-sm uppercase"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Output</h3>
            <button onClick={() => copyToClipboard(formatSampleText(output), "output")} className="px-3 py-1 text-xs rounded-md bg-cyan-600 text-gray-950 hover:bg-cyan-400 font-medium transition-all duration-300 flex items-center gap-1 shadow hover:shadow-md">
              {copied === "output" ? (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Copied!</>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy</>)}</button>
          </div>
          <pre className="whitespace-pre-wrap font-mono bg-gray-950/70 p-3 rounded-md border border-gray-700/70 group-hover:border-cyan-600/60 transition-all duration-300 text-xs sm:text-sm leading-relaxed text-gray-300 min-h-[60px] max-h-[200px] overflow-y-auto">
            {formatSampleText(output)}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

const StatusAnimation = ({ status, message }) => { 
  const baseColors = { Accepted: "#22c55e", "Wrong Answer": "#ef4444", "Time Limit Exceeded": "#f97316", "Runtime Error": "#ec4899", "Compilation Error": "#f97316", "Queued": "#eab308", "Submitting...": "#3b82f6", Error: "#ef4444" };
  const color = baseColors[status] || "#06b6d4";
  return ( <motion.div initial={{ scale: 0.8, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: -20 }} className="fixed top-6 right-6 p-4 rounded-lg z-[100] backdrop-blur-md shadow-2xl" style={{ backgroundColor: "rgba(17, 24, 39, 0.9)", border: `2px solid ${color}`, boxShadow: `0 0 25px -5px ${color}, 0 0 15px ${color} inset`, }} > <div className="flex items-center gap-3"> {status === "Accepted" ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2} > <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> )} <div className="text-lg font-semibold" style={{ color: color }} > {status} </div> </div> {message && <p className="text-sm text-gray-300 mt-1 max-w-xs truncate" title={message}>{message}</p>} <motion.div className="absolute inset-0 rounded-lg pointer-events-none" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.10, 1], opacity: [0.15, 0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} style={{ border: `1px solid ${color}`, boxShadow: `0 0 10px ${color}`, }} /> </motion.div> );
};

const TestRunner = ({ language, code }) => { 
  const [input, setInput] = useState(""); const [output, setOutput] = useState(""); const [isRunning, setIsRunning] = useState(false);
  const runTest = async () => { setIsRunning(true); setOutput("Initializing test runner...\nThis feature currently requires a custom backend API for code execution (/api/submissions/test)."); try { const res = await fetch("/api/submissions/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, code, input }), }); if (!res.ok) { const errText = await res.text(); throw new Error(`API Error: ${res.status} - ${errText || 'Failed to run test'}`); } const result = await res.json(); setOutput(result.output || "No output received from test run."); } catch (err) { setOutput("Error running test: " + err.message); } finally { setIsRunning(false); } };
  return ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4" > <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div className="relative group"> <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" /> <div className="relative"> <h3 className="text-cyan-400 mb-2 flex items-center gap-2 font-semibold"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> </svg> Input </h3> <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={isRunning} className="w-full h-40 p-3 bg-gray-800/70 border border-cyan-700/60 rounded-lg font-mono resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-gray-300 placeholder-gray-500" placeholder="Enter test input here..." /> </div> </div> <div className="relative group"> <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" /> <div className="relative"> <h3 className="text-cyan-400 mb-2 flex items-center gap-2 font-semibold"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> </svg> Output </h3> <pre className={`w-full h-40 p-3 bg-gray-800/70 border border-cyan-700/60 rounded-lg font-mono overflow-auto whitespace-pre-wrap ${ isRunning ? "animate-pulse opacity-60" : "" } transition-all duration-300 text-gray-300`} > {output || "Output will appear here..."} </pre> </div> </div> </div> <motion.button onClick={runTest} disabled={isRunning} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={` w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${ isRunning ? "bg-cyan-700/50 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.6)]" } text-white transition-all duration-300 `} > {isRunning ? ( <> <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" > <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /> </svg> Running Test... </> ) : ( <> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" > <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /> </svg> Run Test </> )} </motion.button> </motion.div> );
};

const SubmissionHistory = ({ problemId, supabase, currentUser }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!supabase || !problemId) { setLoading(false); return; }
      if (!currentUser) { setSubmissions([]); setLoading(false); return; }
      setLoading(true); setError("");
      try {
        const { data, error: dbError } = await supabase.from("Submission").select("submission_id, submitted_at, language, status, exec_time, memory_used").eq("problem_id", problemId).eq("user_id", currentUser.id).order("submitted_at", { ascending: false }).limit(20);
        if (dbError) throw dbError;
        setSubmissions(data || []);
      } catch (err) { console.error("Failed to fetch submission history:", err); setError(`Failed to load history: ${err.message}`); setSubmissions([]); } 
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [problemId, supabase, currentUser]);

  if (loading) return <div className="text-center py-4"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div></div>;
  if (error) return <p className="text-red-400 text-center py-4">{error}</p>;
  if (!currentUser && problemId) return <p className="text-gray-400 text-center py-4">Log in to see your submissions.</p>; 
  if (submissions.length === 0 && currentUser) return <p className="text-gray-400 text-center py-4">No submissions yet for this problem.</p>;
  if (submissions.length === 0 && !currentUser) return null;

  return (
    <div className="overflow-x-auto text-gray-300">
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b-2 border-cyan-700/70 text-cyan-300 uppercase tracking-wider"><th className="p-3">When</th><th className="p-3">Language</th><th className="p-3">Status</th><th className="p-3">Time</th><th className="p-3">Memory</th></tr></thead>
        <tbody>{submissions.map((sub) => (<tr key={sub.submission_id} className="border-b border-gray-700/60 hover:bg-gray-800/40 transition-colors duration-150"><td className="p-3 whitespace-nowrap">{new Date(sub.submitted_at).toLocaleString()}</td><td className="p-3">{sub.language}</td><td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ sub.status === "Accepted" ? "bg-green-500/20 text-green-300 border border-green-500/30" : sub.status === "Pending" || sub.status === "Queued" || sub.status === "Submitting..." ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30" }`}>{sub.status}</span></td><td className="p-3">{sub.exec_time !== null && sub.exec_time !== undefined ? `${sub.exec_time} ms` : "N/A"}</td><td className="p-3">{sub.memory_used !== null && sub.memory_used !== undefined ? `${(sub.memory_used / 1024).toFixed(2)} MB` : "N/A"}</td></tr>))}</tbody>
      </table>
    </div>
  );
};

function ParsedHtmlContent({ htmlContent, className = "prose prose-sm sm:prose-base prose-invert max-w-none text-gray-300 leading-relaxed prose-headings:text-cyan-400 prose-headings:font-bold prose-headings:tracking-wide prose-strong:text-cyan-300 prose-a:text-sky-400 hover:prose-a:text-sky-300 prose-code:text-pink-400 prose-code:bg-gray-800/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-pre:bg-gray-900/80 prose-pre:border prose-pre:border-gray-700/70 prose-pre:rounded-lg prose-pre:shadow-md prose-pre:p-4 prose-pre:text-sm" }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || typeof htmlContent !== 'string') {
        if(contentRef.current) contentRef.current.innerHTML = "<p class='italic text-gray-500'>Content not available or not in HTML format.</p>";
        return;
    }
    contentRef.current.innerHTML = htmlContent;
    try {
        const pres = Array.from(contentRef.current.querySelectorAll("pre"));
        pres.forEach((pre) => {
            if (pre.parentNode.classList.contains('code-wrapper-with-copy')) return;

            const wrapper = document.createElement("div");
            wrapper.className = "relative group code-wrapper-with-copy mb-4";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            
            const btn = document.createElement("button");
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Copy`;
            btn.className = "copy-btn absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-1 shadow";
            
            btn.onclick = () => {
                const textToCopy = pre.innerText;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Copied!`;
                        setTimeout(() => { btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Copy`; }, 2000);
                    }).catch(err => { console.error('navigator.clipboard.writeText failed: ', err); fallbackCopyToClipboard(textToCopy, btn); });
                } else { 
                    fallbackCopyToClipboard(textToCopy, btn);
                }
            };
            const fallbackCopyToClipboard = (text, buttonElement) => {
                const textArea = document.createElement("textarea"); textArea.value = text; document.body.appendChild(textArea); textArea.select();
                try { document.execCommand('copy'); buttonElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Copied!`; setTimeout(() => {buttonElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Copy`;}, 2000); } 
                catch (err) { console.error('Fallback copy failed: ', err); buttonElement.innerHTML = 'Error'; setTimeout(() => {buttonElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Copy`;}, 2000); }
                document.body.removeChild(textArea);
            };
            wrapper.appendChild(btn);
        });
    } catch (e) { console.error("Error adding copy buttons to <pre> tags:", e); }
  }, [htmlContent]);

  return <div ref={contentRef} key={htmlContent ? htmlContent.substring(0,100) + htmlContent.length : Date.now()} className={className} />;
}

// --- Main ProblemPage Component ---
export default function ProblemPage() {
  const { external_id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("Statement");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [file, setFile] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setVerdict] = useState(null); 
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [errorProblem, setErrorProblem] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUserAndProblem = async () => {
      if (!supabase) { setErrorProblem("Supabase client not available."); setLoadingProblem(false); return; }
      setLoadingProblem(true); setErrorProblem("");

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!external_id) { setErrorProblem("Problem ID missing."); setLoadingProblem(false); return; }
      try {
        const { data: problemData, error: problemFetchError } = await supabase.from("Problem").select(`*, Online_judge ( name ), Problem_tag ( Tag ( name ) )`).eq("external_id", external_id).single();
        if (problemFetchError) throw problemFetchError;
        if (problemData) {
          const formattedProblem = {
            ...problemData,
            source_name: problemData.Online_judge ? problemData.Online_judge.name : "N/A",
            tags: (problemData.Problem_tag || []).map(pt => pt.Tag ? pt.Tag.name : null).filter(name => name != null),
            samples: typeof problemData.samples === 'string' ? JSON.parse(problemData.samples || "[]") : (problemData.samples || []),
          };
          setProblem(formattedProblem);
          const initialLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
          // Only set template if code is empty or still the default template of *some* language
          // This prevents overwriting user's typed code if they just switch tabs and come back
          if (!code || LANGUAGES.some(l => l.template === code)) {
            setCode(initialLang.template);
          }
        } else { setErrorProblem("Problem not found."); setProblem(null); }
      } catch (err) { console.error("Failed to fetch problem from Supabase:", err); setErrorProblem(`Failed to load problem: ${err.message}`); setProblem(null); } 
      finally { setLoadingProblem(false); }
    };
    getUserAndProblem();
  }, [external_id]); // Only refetch problem if external_id changes

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) { setFile(selectedFile); setCode(""); }
  };

  const handleLanguageChange = (e) => {
    const newLangId = e.target.value;
    setLanguage(newLangId);
    const currentLangTemplate = LANGUAGES.find((l) => l.id === newLangId)?.template;
    if (!file) { setCode(currentLangTemplate || ""); } // Only set template if no file is selected
  };
  
  const handleSubmit = async () => {
    if (!supabase) { setVerdict({ status: "Error", message: "Supabase not initialized." }); setShowVerdict(true); setTimeout(() => setShowVerdict(false), 3000); return; }
    if (!currentUser) { setVerdict({ status: "Error", message: "You must be logged in to submit." }); setShowVerdict(true); setTimeout(() => setShowVerdict(false), 3000); return; }
    if (!problem || !problem.problem_id) { setVerdict({ status: "Error", message: "Problem data not loaded." }); setShowVerdict(true); setTimeout(() => setShowVerdict(false), 3000); return; }

    let sourceCode = code;
    if (file) { try { sourceCode = await file.text(); } catch (e) { console.error("Error reading file:", e); setVerdict({ status: "Error", message: "Could not read file." }); setShowVerdict(true); setTimeout(() => setShowVerdict(false), 3000); return; } }
    if (!sourceCode || !sourceCode.trim()) { setVerdict({ status: "Error", message: "Code cannot be empty." }); setShowVerdict(true); setTimeout(() => setShowVerdict(false), 3000); return; }

    setVerdict({ status: "Submitting..." }); setShowVerdict(true);
    try {
      const submissionData = { user_id: currentUser.id, problem_id: problem.problem_id, language: language, solution_code: sourceCode, status: "Pending" };
      const { data: newSubmission, error } = await supabase.from("Submission").insert(submissionData).select().single();
      if (error) throw error;
      console.log("Submission successful:", newSubmission);
      setVerdict({ status: "Queued", message: `Submission ID: ${newSubmission.submission_id}. It's in the queue.` });
      // To refresh submission history, one could trigger a refetch or manage state more globally
    } catch (err) {
      console.error("Submit failed:", err);
      setVerdict({ status: "Error", message: `Submission Error: ${err.message}` });
    } finally {
        setTimeout(() => setShowVerdict(false), 5000); 
        setSubmitOpen(false); 
        setFile(null); 
    }
  };

  // Prepare content for tabs - this logic is inside the component body to access `problem` and `activeTab`
  let stmtHTML = "", inputHTML = "", outputHTML = "", samplesFromProblem = [];
  if (problem) {
      // START: Logic to clean statement_html for the "Statement" tab
      const rawFullHtmlFromDb = problem.statement_html || "";
      if (rawFullHtmlFromDb) {
          try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(rawFullHtmlFromDb, "text/html");
              let contentNode = doc.querySelector('.problem-statement'); // Main container for problem content
              
              if (contentNode) {
                  const clonedNode = contentNode.cloneNode(true);
                  
                  // Remove known sections that should not be in the "Statement" tab
                  const header = clonedNode.querySelector('.header'); // Contains time/memory limits
                  if (header) header.remove();
                  
                  const inputSpecDiv = clonedNode.querySelector('.input-specification');
                  if (inputSpecDiv) inputSpecDiv.remove();
                  
                  const outputSpecDiv = clonedNode.querySelector('.output-specification');
                  if (outputSpecDiv) outputSpecDiv.remove();
                  
                  const sampleTestsDiv = clonedNode.querySelector('.sample-tests');
                  if (sampleTestsDiv) sampleTestsDiv.remove();
                  
                  const noteDiv = clonedNode.querySelector('.note');
                  if (noteDiv) noteDiv.remove();

                  // Remove h3/h4 titles for Input, Output, Example, Note if they are direct children of .problem-statement
                  // This is a bit more aggressive and assumes a certain structure.
                  Array.from(clonedNode.children).forEach(child => {
                      if (child.tagName.match(/^H[34]$/i)) {
                          const childText = child.textContent.toLowerCase();
                          if (childText.includes("input") || childText.includes("output") || childText.includes("example") || childText.includes("note")) {
                              child.remove();
                          }
                      }
                  });

                  stmtHTML = clonedNode.innerHTML.trim();
              } else {
                  // Fallback if .problem-statement div is not the top-level container of rawFullHtmlFromDb
                  // This might happen if rawFullHtmlFromDb is already just the inner content.
                  // In this case, we can't reliably remove sections by class from a string fragment without more context.
                  // For now, we'll use the raw HTML and hope it's mostly statement.
                  // A more robust solution is to ensure the scraper saves ONLY the narrative statement.
                  stmtHTML = rawFullHtmlFromDb; 
                  console.warn("ProblemPage: '.problem-statement' div not found in statement_html. Displaying raw content for Statement tab. Scraper should ideally provide cleaner statement_html.");
              }
          } catch (e) {
              console.error("Error cleaning statement_html:", e);
              stmtHTML = rawFullHtmlFromDb; // Fallback to raw on error
          }
      }
      if (!stmtHTML) {
          stmtHTML = "<p class='italic text-gray-500'>Problem statement not available.</p>";
      }
      // END: Logic to clean statement_html

      // Prepare inputHTML for the "Input" tab
      // Prefer dedicated field, then try to extract from raw statement if dedicated is empty/short
      inputHTML = problem.input_spec || "";
      if ((!inputHTML || inputHTML.length < 20) && rawFullHtmlFromDb) { // Check length as well
          const extractedInput = extractSpecificSection(rawFullHtmlFromDb, '.input-specification', "Input(?: Format)?");
          if (extractedInput) inputHTML = extractedInput;
      }
      if (inputHTML && !inputHTML.trim().startsWith("<") && !inputHTML.trim().endsWith(">")) { inputHTML = `<p>${inputHTML.replace(/\n/g, "<br/>")}</p>`; }
      else if (!inputHTML && activeTab === "Input") { inputHTML = "<p class='italic text-gray-500'>No specific input format provided. Check statement or examples.</p>"; }

      // Prepare outputHTML for the "Output" tab
      outputHTML = problem.output_spec || "";
      if ((!outputHTML || outputHTML.length < 20) && rawFullHtmlFromDb) { // Check length
          const extractedOutput = extractSpecificSection(rawFullHtmlFromDb, '.output-specification', "Output(?: Format)?");
          if (extractedOutput) outputHTML = extractedOutput;
      }
      if (outputHTML && !outputHTML.trim().startsWith("<") && !outputHTML.trim().endsWith(">")) { outputHTML = `<p>${outputHTML.replace(/\n/g, "<br/>")}</p>`; }
      else if (!outputHTML && activeTab === "Output") { outputHTML = "<p class='italic text-gray-500'>No specific output format provided. Check statement or examples.</p>"; }
      
      samplesFromProblem = problem.samples || [];
  }

// Helper function to extract content of a specific div by class OR by heading text if class not found
function extractSpecificSection(fullHtml, classSelector, headingText = null) {
    if (!fullHtml) return null;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullHtml, "text/html");
        let sectionNode = doc.querySelector(classSelector);

        if (sectionNode) {
            return sectionNode.innerHTML.trim();
        } else if (headingText) {
            // Fallback to find by heading if class selector fails
            const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b"));
            const sectionHeading = headings.find(h => new RegExp(headingText, "i").test(h.textContent));
            
            if (sectionHeading) {
                let content = "";
                let sibling = sectionHeading.nextElementSibling;
                while (sibling) {
                    if (sibling.tagName.match(/^H[1-6]$/i) || (sibling.tagName === 'DIV' && (sibling.classList.contains('sample-tests') || sibling.classList.contains('note')))) {
                        // Stop if we hit another major heading or known section
                        break;
                    }
                    content += sibling.outerHTML;
                    sibling = sibling.nextElementSibling;
                }
                return content.trim() || null;
            }
        }
        return null;
    } catch (e) {
        console.error(`Error extracting section ${classSelector || headingText}:`, e);
        return null;
    }
}


  const renderTabContent = () => {
    if (!problem) return <div className="text-center text-gray-400 py-8">Problem data is not available.</div>;
    switch (activeTab) {
      case "Statement": return <ParsedHtmlContent htmlContent={stmtHTML} />;
      case "Input": return <ParsedHtmlContent htmlContent={inputHTML} />;
      case "Output": return <ParsedHtmlContent htmlContent={outputHTML} />;
      case "Examples": return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}> {samplesFromProblem.length > 0 ? (samplesFromProblem.map((sample, idx) => (<SampleTest key={idx} input={sample.input} output={sample.output} />))) : (<div className="text-center text-gray-400 py-4">No example test cases available.</div>)}</motion.div>);
      case "Submissions": return problem.problem_id && currentUser ? <SubmissionHistory problemId={problem.problem_id} supabase={supabase} currentUser={currentUser} /> : <div className="text-center text-gray-400 py-4">{currentUser ? "Loading submissions..." : "Log in to view your submissions."}</div>;
      case "Test Runner": return <TestRunner language={LANGUAGES.find((l) => l.id === language)?.monacoLang || language} code={code} />;
      default: return null;
    }
  };

  if (loadingProblem) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200"> <div className="relative"> <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-20 rounded-lg blur-lg animate-pulse" /> <div className="relative bg-gray-900 px-8 py-4 rounded-lg border border-cyan-700/50 shadow-2xl"> <div className="flex items-center gap-3 text-cyan-400"> <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" > <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /> </svg> <span className="text-lg font-medium">Loading Problem Details...</span> </div> </div> </div> </div> ); }
  if (errorProblem) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400"> <p className="text-xl p-8 bg-gray-900 rounded-lg border border-red-700 shadow-xl">{errorProblem}</p> </div> ); }
  if (!problem) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400"> <p className="text-xl p-8 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">Problem not found or could not be loaded.</p> </div> ); }
  
  return (
    <div className="max-w-6xl mx-auto mt-10 mb-12 px-4 sm:px-6 lg:px-8 text-gray-200 font-['Orbitron',_sans-serif] antialiased">
      <AnimatePresence>{showVerdict && verdict && <StatusAnimation status={verdict.status} message={verdict.message || verdict.verdict_detail} />}</AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/15 border border-cyan-600/40 bg-gray-900/85 backdrop-blur-lg"
      >
        <header className="flex flex-col sm:flex-row items-center justify-between bg-gray-950/80 p-4 sm:p-6 border-b-2 border-cyan-500/60 relative shadow-md">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <button 
            onClick={() => navigate(-1)} 
            className="self-start sm:self-center mb-3 sm:mb-0 px-4 py-2 bg-gray-800/80 text-cyan-300 rounded-lg border border-cyan-700/60 hover:bg-cyan-700/30 hover:text-cyan-100 hover:border-cyan-500 transition-all duration-300 relative z-10 text-sm font-medium group shadow-sm hover:shadow-cyan-500/20"
          >
            <span className="group-hover:tracking-wider transition-all duration-300">← Back</span>
          </button>
          <h1 
            className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-300 text-center relative z-10 truncate px-2 flex-grow mx-2 sm:mx-4" 
            title={problem.title}
            style={{ textShadow: '0 0 6px rgba(0, 220, 255, 0.6), 0 0 12px rgba(0, 220, 255, 0.4)' }}
          >
            {problem.title}
          </h1>
          <button 
            onClick={() => { if (!currentUser) { alert("Please log in to submit a solution."); return; } setSubmitOpen(true); }} 
            className="self-end sm:self-center mt-3 sm:mt-0 px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 relative z-10 shadow-md hover:shadow-lg hover:shadow-cyan-500/40 text-sm"
          >
            Submit Solution
          </button>
        </header>
        
        <div className="flex overflow-x-auto sm:overflow-x-visible bg-gray-800/70 border-b border-cyan-700/50 relative">
          <div className="absolute bottom-0 h-[3px] bg-cyan-400 transition-all duration-300 " style={{left: `${(100 / TABS.length) * TABS.indexOf(activeTab)}%`, width: `${100 / TABS.length}%`, boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'}}/>
          {TABS.map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3.5 px-2 min-w-[100px] sm:min-w-0 text-center font-medium transition-all duration-200 relative text-xs sm:text-sm md:text-base tracking-wider ${activeTab === tab ? "text-cyan-300 font-bold opacity-100" : "text-gray-400 hover:text-cyan-400 opacity-70 hover:opacity-100" }`}> <span className="relative z-10">{tab}</span></button>))}
        </div>

        <div className="bg-gray-900/75 p-4 sm:p-8 min-h-[400px] ">
          <div className="flex flex-wrap gap-x-3 gap-y-2 mb-6 items-center">
            <span className="px-3 py-1.5 bg-gray-800/70 text-cyan-400 text-xs font-semibold rounded-md border border-cyan-700/60 shadow-sm hover:shadow-cyan-500/20 transition-shadow">
              Source: {problem.source_name || "N/A"}
            </span>
            <span className="px-3 py-1.5 bg-gray-800/70 text-cyan-400 text-xs font-semibold rounded-md border border-cyan-700/60 shadow-sm hover:shadow-cyan-500/20 transition-shadow">
              Difficulty: {problem.difficulty || "Unrated"}
            </span>
            <span 
              className="px-3 py-1.5 bg-pink-700/30 text-pink-300 text-xs font-semibold rounded-md border border-pink-500/60 shadow-sm hover:shadow-pink-500/30 transition-shadow"
              style={{boxShadow: '0 0 6px rgba(236, 72, 153, 0.4)'}}
            >
              Time: {problem.time_limit / 1000}s
            </span>
            <span 
              className="px-3 py-1.5 bg-sky-700/30 text-sky-300 text-xs font-semibold rounded-md border border-sky-500/60 shadow-sm hover:shadow-sky-500/30 transition-shadow"
              style={{boxShadow: '0 0 6px rgba(14, 165, 233, 0.4)'}}
            >
              Memory: {Math.round(problem.mem_limit / 1024)}MB
            </span>
          </div>
          {renderTabContent()}
        </div>
      </motion.div>

      <AnimatePresence>
        {submitOpen && problem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-[99] p-4">
            <motion.div initial={{ scale: 0.95, opacity:0, y: 10 }} animate={{ scale: 1, opacity:1, y: 0 }} exit={{ scale: 0.95, opacity:0, y: 10 }} className="bg-gray-900 text-gray-300 p-6 rounded-xl shadow-2xl w-full max-w-5xl relative border-2 border-cyan-600/80 shadow-cyan-500/30">
              <button onClick={() => setSubmitOpen(false)} className="absolute top-3 right-4 text-gray-500 hover:text-cyan-400 transition text-3xl leading-none font-light">&times;</button>
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-3" style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.5)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Submit Solution: <span className="text-gray-300 truncate ml-2 font-normal">{problem.title}</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">Language
                    <select value={language} onChange={handleLanguageChange} className="w-full mt-1 p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all duration-300 hover:border-cyan-600 text-gray-200 placeholder-gray-500">
                      {LANGUAGES.map((lang) => (<option key={lang.id} value={lang.id}>{lang.name}</option>))}
                    </select>
                  </label>
                  <div className="mb-4 relative group mt-4">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 via-sky-500 to-pink-500 opacity-10 group-hover:opacity-25 transition duration-400 rounded-lg blur"></div>
                    <div className="relative">
                      <MonacoEditor 
                        height="max(300px, calc(100vh - 560px))" 
                        language={LANGUAGES.find((l) => l.id === language)?.monacoLang || 'plaintext'} 
                        theme="vs-dark" 
                        value={code} 
                        onChange={(value) => { setCode(value || ""); if (file) setFile(null); }} 
                        options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16, bottom:16 }, scrollBeyondLastLine: false, automaticLayout: true, lineNumbersMinChars: 3, wordWrap: "on", fontLigatures: true, renderLineHighlight: "gutter", cursorBlinking: "smooth", cursorSmoothCaretAnimation: true }} 
                        className="rounded-lg overflow-hidden border border-gray-700/70"
                      />
                    </div>
                  </div>
                  <label className="block mb-4 text-sm font-medium text-gray-300">Or Upload File
                    <input type="file" accept=".cpp,.py,.java,.js,.txt" onChange={onFileChange} className="block mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-gray-900 hover:file:bg-cyan-500 file:font-semibold text-gray-400 cursor-pointer"/>
                  </label>
                </div>
                <div className="border-l border-gray-700/60 pl-6 md:pt-0 pt-6">
                  <h3 className="text-xl text-cyan-400 mb-4 font-semibold" style={{ textShadow: '0 0 3px rgba(0, 255, 255, 0.4)'}}>Test Your Code <span className="text-xs text-gray-500">(Optional)</span></h3>
                  <TestRunner language={LANGUAGES.find((l) => l.id === language)?.monacoLang || language} code={code} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700/60">
                <button onClick={() => setSubmitOpen(false)} className="px-5 py-2.5 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition font-medium">Cancel</button>
                <button onClick={handleSubmit} className="px-7 py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-cyan-500/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1.707-12.707a1 1 0 00-1.414-1.414L6.586 7.586a1 1 0 000 1.414l3.707 3.707a1 1 0 001.414-1.414L9.414 9H13.5a1 1 0 000-2H9.414l2.293-2.293z" clipRule="evenodd" /></svg>
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

