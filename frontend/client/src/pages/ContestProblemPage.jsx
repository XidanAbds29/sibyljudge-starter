import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import SampleTest from "../components/SampleTest";
import StatusAnimation from "../components/StatusAnimation";
import TestRunner from "../components/TestRunner";
import SubmissionHistory from "../components/SubmissionHistory";
import parse, { domToReact } from 'html-react-parser';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const TABS = [
  "Statement",
  "Input",
  "Output",
  "Examples",
  "Submissions",
  "Test Runner",
];

const LANGUAGES = [
  {
    id: "cpp",
    name: "C++17",
    template:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
    monacoLang: "cpp",
  },
  {
    id: "python",
    name: "Python 3.13",
    template:
      "# Your Python solution here\n\ndef solve():\n    # Read input\n    # Process and solve\n    # Print output\n    pass\n\nif __name__ == '__main__':\n    solve()",
    monacoLang: "python",
  },
  {
    id: "java",
    name: "Java 23",
    template:
      "import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Your code here\n        scanner.close();\n    }\n}",
    monacoLang: "java",
  },
];

const DEFAULT_TIME_LIMIT_MS = 2000;
const DEFAULT_MEMORY_LIMIT_KB = 262144;

// Add these helper functions from ProblemPage
function extractSpecificSection(fullHtml, classSelector, headingTextRegexString = null) {
  if (!fullHtml) return null;
  try {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(fullHtml, "text/html");
    let sectionNode = doc.querySelector(classSelector);
    if (sectionNode) {
      if (
        headingTextRegexString &&
        sectionNode.firstElementChild &&
        sectionNode.firstElementChild.tagName.match(/^H[1-6]$/i) &&
        new RegExp(headingTextRegexString, "i").test(sectionNode.firstElementChild.textContent)
      ) {
        sectionNode.firstElementChild.remove();
      }
      return sectionNode.innerHTML.trim();
    } else if (headingTextRegexString) {
      const headings = Array.from(
        doc.querySelectorAll(
          "h1, h2, h3, h4, h5, h6, strong, b, div.section-title"
        )
      );
      const sectionHeading = headings.find((h) =>
        new RegExp(headingTextRegexString, "i").test(h.textContent)
      );
      if (sectionHeading) {
        let content = "";
        let node = sectionHeading.nextElementSibling;
        while (node && (!node.tagName || !/^H[1-6]$/i.test(node.tagName))) {
          content += node.outerHTML || "";
          node = node.nextElementSibling;
        }
        return content.trim();
      }
    }
  } catch (e) {}
  return null;
}
// Replace renderHtmlWithMath with the full version from ProblemPage
function renderHtmlWithMath(html) {
  if (!html) return null;
  // Regexes for math
  const blockMathRegex = /\${3}([\s\S]+?)\${3}/g; // $$$...$$$
  const inlineMathRegex = /\${2}([\s\S]+?)\${2}/g; // $$...$$
  const singleMathRegex = /\$([^$\n]+?)\$/g; // $...$
  function parseMath(text) {
    // Replace $$$...$$$ (always as inline math)
    let elements = [];
    let lastIndex = 0;
    let match;
    while ((match = blockMathRegex.exec(text))) {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }
      const mathContent = match[1].trim();
      elements.push(<InlineMath key={match.index}>{mathContent}</InlineMath>);
      lastIndex = blockMathRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    // Now handle $$...$$ and $...$ as inline math in each part
    elements = elements.flatMap((part, i) => {
      if (typeof part !== 'string') return [part];
      // First $$...$$
      let subparts = [];
      let last = 0;
      let m;
      while ((m = inlineMathRegex.exec(part))) {
        if (m.index > last) subparts.push(part.slice(last, m.index));
        subparts.push(<InlineMath key={i + '-d-' + m.index}>{m[1]}</InlineMath>);
        last = inlineMathRegex.lastIndex;
      }
      if (last < part.length) subparts.push(part.slice(last));
      // Now $...$
      return subparts.flatMap((sp, j) => {
        if (typeof sp !== 'string') return [sp];
        let sps = [];
        let l = 0;
        let sm;
        while ((sm = singleMathRegex.exec(sp))) {
          if (sm.index > l) sps.push(sp.slice(l, sm.index));
          sps.push(<InlineMath key={i + '-s-' + j + '-' + sm.index}>{sm[1]}</InlineMath>);
          l = singleMathRegex.lastIndex;
        }
        if (l < sp.length) sps.push(sp.slice(l));
        return sps;
      });
    });
    return elements;
  }
  return parse(html, {
    replace: (domNode) => {
      if (domNode.type === 'text') {
        return <>{parseMath(domNode.data)}</>;
      }
    },
  });
}

export default function ContestProblemPage() {
  const { contestId, problemId } = useParams();
  const { user: authUser, supabase: supabaseFromAuth } = useAuth();
  const mainRef = useRef(null);
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("Statement");
  const [samplesFromProblem, setSamplesFromProblem] = useState([]);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [file, setFile] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [errorProblem, setErrorProblem] = useState("");

  useEffect(() => {
    if (typeof window.gsap !== "undefined") {
      const ctx = window.gsap.context(() => {
        if (mainRef.current && problem) {
          window.gsap.fromTo(
            mainRef.current,
            {
              opacity: 0,
              y: 40,
              filter: "blur(10px)",
            },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "power4.out",
            }
          );
          const cards = mainRef.current.querySelectorAll(
            ".problem-section-animate"
          );
          if (cards.length > 0) {
            window.gsap.fromTo(
              cards,
              {
                opacity: 0,
                y: 30,
                scale: 0.97,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                stagger: 0.09,
                ease: "power3.out",
                delay: 0.2,
              }
            );
          }
        }
      }, mainRef);
      return () => ctx.revert();
    }
  }, [problem]);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemId) {
        setErrorProblem("Problem ID missing.");
        setLoadingProblem(false);
        return;
      }
      setLoadingProblem(true);
      setErrorProblem("");
      try {
        let url = `/api/contests/${contestId}/problem/${problemId}`;
        if (authUser && authUser.id) {
          url += `?user_id=${encodeURIComponent(authUser.id)}`;
        }
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 401) {
          setErrorProblem("You must be logged in to view this contest problem (during contest). After the contest ends, anyone can view.");
          setProblem(null);
          setLoadingProblem(false);
          return;
        }
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `API Error: ${res.status} - ${errorText || "Failed to load problem"}`
          );
        }
        const problemData = await res.json();
        setProblem(problemData);
        // --- Sample Extraction Logic ---
        let samples = [];
        if (
          Array.isArray(problemData.sample_tests) &&
          problemData.sample_tests.length > 0
        ) {
          samples = problemData.sample_tests.map((s) => ({
            input: s.input || s.sample_input || "",
            output: s.output || s.sample_output || "",
          }));
        } else if (problemData.sample_input && problemData.sample_output) {
          samples = [
            {
              input: problemData.sample_input,
              output: problemData.sample_output,
            },
          ];
        } else if (problemData.statement_html) {
          try {
            const parser = new window.DOMParser();
            const doc = parser.parseFromString(problemData.statement_html, "text/html");
            const inputs = doc.querySelectorAll(".input pre");
            const outputs = doc.querySelectorAll(".output pre");
            for (let i = 0; i < Math.max(inputs.length, outputs.length); i++) {
              let input = inputs[i]?.innerHTML || "";
              let output = outputs[i]?.innerHTML || "";
              input = input.replace(/<br\s*\/?>(\n)?/gi, "\n");
              output = output.replace(/<br\s*\/?>(\n)?/gi, "\n");
              input = input.replace(/&nbsp;/gi, " ");
              output = output.replace(/&nbsp;/gi, " ");
              input = input.replace(/<[^>]+>/g, "");
              output = output.replace(/<[^>]+>/g, "");
              const decode = (str) => {
                const txt = document.createElement('textarea');
                txt.innerHTML = str;
                return txt.value;
              };
              input = decode(input);
              output = decode(output);
              samples.push({ input, output });
            }
          } catch (e) {}
        }
        setSamplesFromProblem(samples.filter((s) => s.input || s.output));
        // --- End Sample Extraction ---
      } catch (err) {
        setErrorProblem(`Failed to load problem: ${err.message}`);
        setProblem(null);
        setSamplesFromProblem([]);
      } finally {
        setLoadingProblem(false);
      }
    };
    fetchProblemDetails();
  }, [contestId, problemId, authUser]);

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCode("");
    }
  };

  const handleLanguageChange = (e) => {
    const newLangId = e.target.value;
    setLanguage(newLangId);
    const currentLangTemplate = LANGUAGES.find((l) => l.id === newLangId)?.template;
    if (!file) {
      setCode(currentLangTemplate || "");
    }
  };

  // Render loading state
  if (loadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-20 rounded-lg blur-lg animate-pulse" />
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-20 rounded-lg blur-lg animate-pulse" />
          <div className="relative bg-gray-900 px-8 py-4 rounded-lg border border-cyan-700/50 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-lg font-medium">Loading Problem Details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (errorProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
          <p className="text-xl p-8 bg-gray-900 rounded-lg border border-red-700 shadow-xl">{errorProblem}</p>
        </div>
      </div>
    );
  }
  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
          <p className="text-xl p-8 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">Problem not found or could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Main render (identical to ProblemPage)
  let stmtHTML = "", inputHTML = "", outputHTML = "";
  if (problem) {
    const rawFullHtmlFromDb = problem.statement_html || "";
    if (rawFullHtmlFromDb) {
      try {
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(rawFullHtmlFromDb, "text/html");
        let contentNode = doc.querySelector(".problem-statement");
        if (!contentNode || !doc.body.contains(contentNode)) {
          contentNode = doc.body;
        }
        if (contentNode) {
          const clonedNode = contentNode.cloneNode(true);
          const selectorsToRemove = [
            ".header",
            ".input-specification",
            ".output-specification",
            ".sample-tests",
            ".note",
          ];
          selectorsToRemove.forEach((selector) => {
            clonedNode.querySelectorAll(selector).forEach((el) => el.remove());
          });
          Array.from(clonedNode.children).forEach((child) => {
            if (child.tagName && child.tagName.match(/^H[1-6]$/i)) {
              const childText = child.textContent.toLowerCase().trim();
              const keywordsToRemove = [
                "input",
                "output",
                "example",
                "sample",
                "note",
                "time limit",
                "memory limit",
              ];
              if (keywordsToRemove.some((keyword) => childText.startsWith(keyword))) {
                child.remove();
              }
            }
          });
          stmtHTML = clonedNode.innerHTML.trim();
        } else {
          stmtHTML = rawFullHtmlFromDb;
        }
      } catch (e) {
        stmtHTML = rawFullHtmlFromDb;
      }
    }
    if (!stmtHTML) {
      stmtHTML = "<p class='italic text-gray-500'>Problem statement not available.</p>";
    }
    inputHTML = problem.input_spec || "";
    if ((!inputHTML || inputHTML.length < 20) && rawFullHtmlFromDb) {
      const extractedInput = extractSpecificSection(rawFullHtmlFromDb, ".input-specification", "Input(?: Format)?");
      if (extractedInput) inputHTML = extractedInput;
    }
    // Only wrap in <div> if not already HTML
    if (inputHTML && !inputHTML.trim().startsWith("<") && !inputHTML.trim().endsWith(">")) {
      inputHTML = `<div class=\"font-mono whitespace-pre-wrap p-2 bg-gray-800/50 rounded-md border border-gray-700\">${inputHTML.replace(/\n/g, "<br/>")}</div>`;
    } else if (!inputHTML) {
      inputHTML = "<p class='italic text-gray-500'>No specific input format provided. Check statement or examples.</p>";
    }
    outputHTML = problem.output_spec || "";
    if ((!outputHTML || outputHTML.length < 20) && rawFullHtmlFromDb) {
      const extractedOutput = extractSpecificSection(rawFullHtmlFromDb, ".output-specification", "Output(?: Format)?");
      if (extractedOutput) outputHTML = extractedOutput;
    }
    // Only wrap in <div> if not already HTML
    if (outputHTML && !outputHTML.trim().startsWith("<") && !outputHTML.trim().endsWith(">")) {
      outputHTML = `<div class=\"font-mono whitespace-pre-wrap p-2 bg-gray-800/50 rounded-md border border-gray-700\">${outputHTML.replace(/\n/g, "<br/>")}</div>`;
    } else if (!outputHTML) {
      outputHTML = "<p class='italic text-gray-500'>No specific output format provided. Check statement or examples.</p>";
    }
  }

  return (
    <ErrorBoundary>
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 animate-gradient-bg bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#00c9ff] opacity-80 blur-2xl" />
      <div ref={mainRef} className="min-h-screen bg-gray-900/90 text-white pb-20 relative z-10">
        {/* Neon glow effect for page header */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 1440 320">
            <path fill="url(#gradient1)" d="M0,128L30,133.3C60,139,120,149,180,160C240,171,300,181,360,186.7C420,192,480,192,540,186.7C600,181,660,171,720,160C780,149,840,139,900,133.3C960,128,1020,128,1080,133.3C1140,139,1200,149,1260,160C1320,171,1380,181,1410,186.7L1440,192L1440,320L1080,320C1140,320,1200,320,1260,320C1320,320,1380,320,1410,320L1440,320Z" />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#00c9ff", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#2c5364", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
          {/* Problem Title and Meta */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.7, ease: "easeOut" }} className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-md border-2 border-cyan-400/40 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] problem-section-animate relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-2 leading-tight animate-gradient-text drop-shadow-lg">
                {problem.title || "Untitled Problem"}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-cyan-200 mb-4 font-mono">
                <p><strong>ID:</strong> {problem.external_id || "N/A"}</p>
                <p><strong>Time Limit:</strong> {(problem.time_limit_ms || DEFAULT_TIME_LIMIT_MS) / 1000}s</p>
                <p><strong>Memory Limit:</strong> {(problem.memory_limit_kb || DEFAULT_MEMORY_LIMIT_KB) / 1024} MB</p>
                <p><strong>Difficulty:</strong> <span className={`font-semibold ${problem.difficulty === "Easy" ? "text-green-400" : problem.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{problem.difficulty || "N/A"}</span></p>
              </div>
              {problem.description && (
                <p className="text-cyan-100/90 text-lg font-light italic mb-2 animate-fade-in">{problem.description}</p>
              )}
            </div>
          </motion.div>
          {/* Problem Tabs Section with neon effect */}
          <div className="overflow-hidden">
            <div className="relative mb-8 flex flex-wrap gap-2 bg-gray-900/60 rounded-xl p-2 shadow-lg border border-cyan-700/40 neon-tabs-bar">
              <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-r from-cyan-400/10 via-pink-400/10 to-sky-400/10 blur-md opacity-60" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
              {TABS.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-base font-semibold rounded-lg transition-all duration-300 relative overflow-hidden group shadow-md border-2 ${activeTab === tab ? "bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 text-white border-cyan-300 shadow-lg scale-105" : "text-cyan-200 hover:text-cyan-100 hover:bg-gray-800/60 border-transparent"}`}
                >
                  {activeTab === tab && (
                    <motion.span layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 rounded-b-lg shadow-lg" />
                  )}
                  {tab}
                </motion.button>
              ))}
            </div>
            {/* Tab Content Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="bg-gray-800/40 rounded-xl p-8 backdrop-blur-md border border-cyan-700/50 shadow-lg problem-section-animate">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                  {activeTab === "Statement" && (
                    <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(stmtHTML)}</div>
                  )}
                  {activeTab === "Input" && (
                    <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(inputHTML)}</div>
                  )}
                  {activeTab === "Output" && (
                    <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(outputHTML)}</div>
                  )}
                  {activeTab === "Examples" && (
                    <div>
                      {samplesFromProblem.length > 0 ? (
                        <div className="w-full flex flex-col gap-6">
                          {samplesFromProblem.map((sample, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-4 w-full border border-cyan-400/40 rounded-xl p-4 bg-gray-900/60" style={{minWidth:'0'}}>
                              {/* Sample Input */}
                              <div className="flex-1 min-w-0">
                                <div className="text-cyan-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Input</div>
                                <div className="relative">
                                  <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-cyan-700/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.input}</pre>
                                  <button className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-700/80 hover:bg-cyan-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 transition" onClick={() => navigator.clipboard.writeText(sample.input)} title="Copy sample input">Copy</button>
                                </div>
                              </div>
                              {/* Sample Output */}
                              <div className="flex-1 min-w-0">
                                <div className="text-pink-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Output</div>
                                <div className="relative">
                                  <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-pink-700/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.output}</pre>
                                  <button className="absolute top-2 right-2 px-2 py-1 text-xs bg-pink-700/80 hover:bg-pink-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-pink-400 transition" onClick={() => navigator.clipboard.writeText(sample.output)} title="Copy sample output">Copy</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-lg">No examples available.</div>
                      )}
                    </div>
                  )}
                  {activeTab === "Submissions" && (
                    problem.problem_id && authUser ? (
                      <SubmissionHistory problemId={problem.problem_id} supabase={supabaseFromAuth} currentUser={authUser} />
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        {authUser ? "Loading submissions..." : "Log in to view your submissions."}
                      </div>
                    )
                  )}
                  {activeTab === "Test Runner" && (
                    <TestRunner language={LANGUAGES.find((l) => l.id === language)?.monacoLang || language} code={code} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
