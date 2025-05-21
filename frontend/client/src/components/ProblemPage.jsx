// frontend/client/src/components/ProblemPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from '@monaco-editor/react';

const TABS = ["Statement", "Input", "Output", "Examples", "Submissions", "Test Runner"];
const LANGUAGES = [
  { 
    id: "cpp", 
    name: "C++ (GCC 11)", 
    template: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
    monacoLang: "cpp"
  },
  { 
    id: "python", 
    name: "Python 3.10", 
    template: "# Your Python solution here\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()",
    monacoLang: "python"
  },
  { 
    id: "java", 
    name: "Java 17", 
    template: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
    monacoLang: "java"
  }
];

function SampleTest({ input, output }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const formatSample = (text) => {
    // Ensure it's a string
    text = String(text || '');
    // Replace multiple consecutive newlines with a single one
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  };

  return (
    <div className="mb-6 bg-sybil-bg/50 rounded-lg border border-sybil-accent/30 overflow-hidden">
      <div className="grid grid-cols-2 gap-0.5">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sybil-accent font-bold">Input</h3>
            <button
              onClick={() => copyToClipboard(input, 'input')}
              className="px-2 py-1 text-xs rounded bg-sybil-accent text-sybil-panel hover:shadow-sybil-glow transition"
            >
              {copied === 'input' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono bg-sybil-panel/50 p-3 rounded">{formatSample(input)}</pre>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sybil-accent font-bold">Output</h3>
            <button
              onClick={() => copyToClipboard(output, 'output')}
              className="px-2 py-1 text-xs rounded bg-sybil-accent text-sybil-panel hover:shadow-sybil-glow transition"
            >
              {copied === 'output' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono bg-sybil-panel/50 p-3 rounded">{formatSample(output)}</pre>
        </div>
      </div>
    </div>
  );
}

// Submission status animations
const StatusAnimation = ({ status }) => {
  const colors = {
    "Accepted": "#00ff00",
    "Wrong Answer": "#ff0000",
    "Time Limit Exceeded": "#ffa500",
    "Runtime Error": "#ff00ff",
    "Compilation Error": "#ff4500"
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50"
      style={{ 
        backgroundColor: "#0d1117",
        border: `2px solid ${colors[status] || "#00fff7"}`,
        boxShadow: `0 0 20px ${colors[status] || "#00fff7"}`
      }}
    >
      <div className="text-xl font-bold" style={{ color: colors[status] || "#00fff7" }}>
        {status}
      </div>
    </motion.div>
  );
};

// Test case runner component
const TestRunner = ({ language, code }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setOutput("Running...");
    
    try {
      const res = await fetch("/api/submissions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input })
      });
      
      const result = await res.json();
      setOutput(result.output);
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-sybil-accent mb-2">Input</h3>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full h-32 p-2 bg-sybil-bg border border-sybil-accent rounded font-mono"
          placeholder="Enter test input here..."
        />
      </div>
      <div>
        <h3 className="text-sybil-accent mb-2">Output</h3>
        <div 
          className="w-full h-32 p-2 bg-sybil-bg border border-sybil-accent rounded font-mono overflow-auto"
        >
          {output || "Output will appear here..."}
        </div>
      </div>
      <button
        onClick={runTest}
        disabled={isRunning}
        className="col-span-2 px-4 py-2 bg-sybil-accent text-sybil-panel rounded hover:shadow-sybil-glow transition disabled:opacity-50"
      >
        {isRunning ? "Running..." : "Run Test"}
      </button>
    </div>
  );
};

// Submissions history component
const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  
  useEffect(() => {
    fetch(`/api/submissions/problem/${problemId}`)
      .then(r => r.json())
      .then(setSubmissions)
      .catch(console.error);
  }, [problemId]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-sybil-accent">
            <th className="p-2">When</th>
            <th className="p-2">Language</th>
            <th className="p-2">Status</th>
            <th className="p-2">Time</th>
            <th className="p-2">Memory</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(sub => (
            <tr key={sub.submission_id} className="border-b border-sybil-accent/30 hover:bg-sybil-accent/10">
              <td className="p-2">{new Date(sub.submitted_at).toLocaleString()}</td>
              <td className="p-2">{sub.language}</td>
              <td className="p-2">
                <span 
                  className={`px-2 py-1 rounded ${
                    sub.status === "Accepted" 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {sub.status}
                </span>
              </td>
              <td className="p-2">{sub.exec_time}ms</td>
              <td className="p-2">{sub.memory_used || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function SampleExample({ html }) {
  const ref = useRef();

  useEffect(() => {
    const pres = ref.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.parentNode.querySelector(".copy-btn")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "relative group mb-4";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className =
        "copy-btn absolute top-2 right-2 px-2 py-0.5 text-xs rounded bg-sybil-accent text-sybil-panel opacity-0 group-hover:opacity-100 transition";
      btn.onclick = () => {
        navigator.clipboard.writeText(pre.innerText);
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      };
      wrapper.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-invert bg-sybil-panel p-4 rounded-lg shadow-sybil-glow"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function ProblemPage() {
  const { external_id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [wrapper, setWrapper] = useState(null);
  const [activeTab, setActiveTab] = useState("Statement");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [file, setFile] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setVerdict] = useState(null);

  // Fetch and wrap HTML
  useEffect(() => {
    fetch(`/api/problems/${external_id}`)
      .then((r) => r.json())
      .then((data) => {
        setProblem(data);
        const div = document.createElement("div");
        div.innerHTML = data.statement_html || "";
        setWrapper(div);
      })
      .catch(() => setProblem(null));
  }, [external_id]);

  if (!problem || !wrapper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sybil-accent animate-pulse">Loading...</div>
      </div>
    );
  }
  // Determine if source is SPOJ
  const isSpoj = problem.source_name === "SPOJ";
    // Prepare tab contents from database fields
  let stmtHTML = problem.statement_html || "";
  let inputHTML = problem.input_spec || "<p>No input specification available.</p>";
  let outputHTML = problem.output_spec || "<p>No output specification available.</p>";
  let samples = problem.samples || [];
    if (isSpoj) {
    // Handle SPOJ problems that may have combined content
    if (!problem.input_spec && !problem.output_spec) {      // If no separate sections, use the full content and extract sections
      stmtHTML = problem.statement_html || wrapper.innerHTML || "";
      const fullHTML = problem.statement_html || wrapper.innerHTML || "";
      
      // Try to find input/output sections in full content
      if (fullHTML.toLowerCase().includes('input')) {
        const inputMatch = fullHTML.match(/<div[^>]*>(?:Input|INPUT)[^<]*<\/div>(.*?)(?:<div|$)/s);
        if (inputMatch && inputMatch[1]) {
          inputHTML = inputMatch[1].trim();
        }
      }
      if (fullHTML.toLowerCase().includes('output')) {
        const outputMatch = fullHTML.match(/<div[^>]*>(?:Output|OUTPUT)[^<]*<\/div>(.*?)(?:<div|$)/s);
        if (outputMatch && outputMatch[1]) {
          outputHTML = outputMatch[1].trim();
        }
      }
      
      if (!inputHTML.includes('<')) inputHTML = "<p>Input specification is included in the problem statement.</p>";
      if (!outputHTML.includes('<')) outputHTML = "<p>Output specification is included in the problem statement.</p>";
    }
  } else {
    // For non-SPOJ problems, ensure we have proper HTML formatting
    if (inputHTML && !inputHTML.includes('<')) {
      inputHTML = `<p>${inputHTML}</p>`;
    }
    if (outputHTML && !outputHTML.includes('<')) {
      outputHTML = `<p>${outputHTML}</p>`;
    }
  }

  // File vs code
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setCode("");
  };
  const handleSubmit = async () => {
    let sourceCode = code;
    if (file) {
      sourceCode = await file.text();
    }

    try {
      const res = await fetch(`/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: problem.problem_id,
          language,
          code: sourceCode
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const submission = await res.json();
      
      setVerdict(submission);
      setShowVerdict(true);
      setTimeout(() => setShowVerdict(false), 3000);
    } catch (err) {
      console.error("Submit failed:", err);
      setVerdict({ status: "Error", exec_time: 0, verdict_detail: err.message });
      setShowVerdict(true);
      setTimeout(() => setShowVerdict(false), 3000);
    }
    
    setSubmitOpen(false);
  };
  // Tab renderer
  const renderTab = () => {
    switch (activeTab) {
      case "Statement":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                Difficulty: {problem.difficulty || "Unrated"}
              </span>
              <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                Time: {problem.time_limit / 1000}s
              </span>
              <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                Memory: {problem.mem_limit / 1024}MB
              </span>
            </div>
            <div 
              className="prose prose-invert prose-pre:bg-sybil-bg prose-pre:border prose-pre:border-sybil-accent/30 prose-pre:rounded-lg"
              dangerouslySetInnerHTML={{ __html: stmtHTML }}
            />
          </motion.div>
        );
      case "Input":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert"
            dangerouslySetInnerHTML={{ __html: inputHTML }}
          />
        );
      case "Output":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert"
            dangerouslySetInnerHTML={{ __html: outputHTML }}
          />
        );
      case "Examples":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {samples.length > 0 ? (
              samples.map((sample, idx) => (
                <SampleTest
                  key={idx}
                  input={sample.input}
                  output={sample.output}
                />
              ))
            ) : (
              <div className="text-center text-sybil-text/70">
                No example test cases available.
              </div>
            )}
          </motion.div>
        );
      case "Submissions":
        return <SubmissionHistory problemId={problem.problem_id} />;
      case "Test Runner":
        return <TestRunner language={language} code={code} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <AnimatePresence>
        {showVerdict && verdict && (
          <StatusAnimation status={verdict.status} />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-2xl border border-sybil-accent/30 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-sybil-bg/80 p-6 border-b border-sybil-accent relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sybil-accent/5 to-transparent"></div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-sybil-panel text-sybil-accent rounded-lg hover:shadow-sybil-glow transition relative"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-sybil-accent text-center relative">
            {problem.title}
          </h1>
          <button
            onClick={() => setSubmitOpen(true)}
            className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded-lg hover:shadow-sybil-glow transition relative"
          >
            Submit Solution
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-sybil-panel/80 border-b border-sybil-accent/30">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-3 text-center font-medium transition relative
                ${activeTab === tab 
                  ? "text-sybil-accent border-b-2 border-sybil-accent shadow-sybil-glow" 
                  : "text-sybil-text/70 hover:text-sybil-text hover:bg-sybil-accent/10"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-sybil-panel/80 p-6">
          {activeTab === "Statement" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                  Difficulty: {problem.difficulty || "Unrated"}
                </span>
                <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                  Time: {problem.time_limit / 1000}s
                </span>
                <span className="px-3 py-1.5 bg-sybil-panel text-sybil-accent rounded-lg border border-sybil-accent shadow-sybil-glow">
                  Memory: {problem.mem_limit / 1024}MB
                </span>
              </div>
              <div
                className="prose prose-invert prose-pre:bg-sybil-bg prose-pre:border prose-pre:border-sybil-accent/30 prose-pre:rounded-lg"
                dangerouslySetInnerHTML={{ __html: stmtHTML }}
              />
            </motion.div>
          )}
          {activeTab === "Submissions" && (
            <SubmissionHistory problemId={problem.problem_id} />
          )}
          {activeTab === "Test Runner" && (
            <TestRunner language={language} code={code} />
          )}
          {/* ...other tabs remain unchanged... */}
        </div>
      </motion.div>

      {/* Enhanced Submission Modal */}
      <AnimatePresence>
        {submitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-sybil-panel text-sybil-text p-6 rounded-2xl shadow-2xl w-full max-w-4xl relative border border-sybil-accent"
            >
              <button
                onClick={() => setSubmitOpen(false)}
                className="absolute top-4 right-4 text-sybil-accent hover:shadow-sybil-glow transition"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-sybil-accent mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Submit Solution
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2">
                    <span className="text-sybil-text">Language</span>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        setCode(LANGUAGES.find(l => l.id === e.target.value).template);
                      }}
                      className="w-full mt-1 p-2 bg-sybil-bg border border-sybil-accent rounded-lg focus:ring-2 focus:ring-sybil-accent transition"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mb-4">
                    <MonacoEditor
                      height="400px"
                      language={LANGUAGES.find(l => l.id === language).monacoLang}
                      theme="vs-dark"
                      value={code}
                      onChange={setCode}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>

                  <label className="block mb-4">
                    <span className="text-sybil-text">Or Upload File</span>
                    <input
                      type="file"
                      accept=".cpp,.py,.java,.js"
                      onChange={onFileChange}
                      className="block mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sybil-accent file:text-sybil-panel hover:file:shadow-sybil-glow"
                    />
                  </label>
                </div>

                <div className="border-l border-sybil-accent/30 pl-6">
                  <h3 className="text-xl text-sybil-accent mb-4">Test Your Code</h3>
                  <TestRunner language={language} code={code} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-sybil-accent/30">
                <button
                  onClick={() => setSubmitOpen(false)}
                  className="px-4 py-2 bg-sybil-panel border border-sybil-accent/30 text-sybil-accent rounded-lg hover:bg-sybil-accent/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-sybil-accent text-sybil-panel rounded-lg hover:shadow-sybil-glow transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
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

