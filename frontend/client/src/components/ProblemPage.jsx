import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import SampleTest from "./SampleTest";
import StatusAnimation from "./StatusAnimation";
import TestRunner from "./TestRunner";
import 'katex/dist/katex.min.css';
// import '../inline-tt.css';
import { BlockMath, InlineMath } from 'react-katex';
import parse, { domToReact } from 'html-react-parser';
import SubmissionHistory from "./SubmissionHistory";

const TABS = [
  "Statement",
  "Input",
  "Output",
  "Examples",
  "Submit",
  "My Submissions",
  "Test Runner",
];

const LANGUAGES = [
  {
    id: "cpp",
    name: "GNU G++14 (C++17)",
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

export default function ProblemPage() {
  // Get problem ID from URL parameters
  const { problem_id } = useParams();
  const navigate = useNavigate(); // For programmatic navigation
  // Get user and Supabase client from AuthContext
  const { user: authUser, supabase: supabaseFromAuth } = useAuth();
  const mainRef = useRef(null); // Ref for the main container for GSAP animations
  const [problem, setProblem] = useState(null); // Stores problem details fetched from API
  const [activeTab, setActiveTab] = useState("Statement"); // Controls which tab content is displayed
  const [samplesFromProblem, setSamplesFromProblem] = useState([]); // Stores sample inputs/outputs
  const [submitOpen, setSubmitOpen] = useState(false); // Controls visibility of submission modal/area
  const [language, setLanguage] = useState(LANGUAGES[0].id); // Currently selected programming language
  const [code, setCode] = useState(LANGUAGES[0].template); // Code in the editor, initialized with template
  const [file, setFile] = useState(null); // Stores uploaded file if user chooses to upload
  const [showVerdict, setShowVerdict] = useState(false); // Controls visibility of submission verdict animation
  const [verdict, setVerdict] = useState(null); // Stores submission verdict data (status, message)
  const [loadingProblem, setLoadingProblem] = useState(true); // Loading state for problem details
  const [errorProblem, setErrorProblem] = useState(""); // Error message for problem fetching

  // GSAP animations and initial samples processing based on problem data
  useEffect(() => {
    // Check if gsap is loaded via CDN before using it
    if (typeof window.gsap !== "undefined") {
      const ctx = window.gsap.context(() => {
        if (mainRef.current && problem) {
          // Main container animation: fade in and slide up
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
          // Animate section cards (e.g., sample tests, problem details)
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
                duration: 0.7, // Stagger animation for multiple cards
                stagger: 0.09, // Stagger animation for multiple cards
                ease: "power3.out",
                delay: 0.2,
              }
            );
          }
        }
      }, mainRef); // Scope the GSAP animations to this ref
      return () => ctx.revert(); // Clean up GSAP animations on component unmount
    } else {
      console.warn("GSAP is not loaded. Animations will not play.");
    }
  }, [problem]); // Re-run this effect when the `problem` data changes

  // Effect to fetch problem details from the backend API
  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problem_id) {
        setErrorProblem("Problem ID missing.");
        setLoadingProblem(false);
        return;
      }
      setLoadingProblem(true);
      setErrorProblem("");
      try {
        // Fetch from real backend API
        const res = await fetch(`/api/problems/${problem_id}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `API Error: ${res.status} - ${
              errorText || "Failed to load problem"
            }`
          );
        }
        const problemData = await res.json();
        setProblem(problemData); // <-- Ensure problem state is set
        // --- Sample Extraction Logic ---
        let samples = [];
        
        // 1. First check if backend provides parsed samples array (from our scraper)
        if (Array.isArray(problemData.samples) && problemData.samples.length > 0) {
          samples = problemData.samples.map((s) => ({
            input: s.input || "",
            output: s.output || "",
          }));
        }
        // 2. If backend provides sample_tests as array (fallback)
        else if (
          Array.isArray(problemData.sample_tests) &&
          problemData.sample_tests.length > 0
        ) {
          samples = problemData.sample_tests.map((s) => ({
            input: s.input || s.sample_input || "",
            output: s.output || s.sample_output || "",
          }));
        } else if (problemData.sample_input && problemData.sample_output) {
          // 3. If backend provides single sample_input/sample_output
          samples = [
            {
              input: problemData.sample_input,
              output: problemData.sample_output,
            },
          ];
        } else if (problemData.statement_html) {
          // 4. Try to extract from statement_html (Codeforces style) - fallback only
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(
              problemData.statement_html,
              "text/html"
            );
            const sampleTests = doc.querySelectorAll(
              ".sample-tests .sample-test"
            );
            if (sampleTests.length > 0) {
              const decode = (str) => {
                const txt = document.createElement('textarea');
                txt.innerHTML = str;
                return txt.value;
              };
              samples = Array.from(sampleTests).map((sampleDiv) => {
                let input = sampleDiv.querySelector("div.input pre")?.innerHTML || "";
                let output = sampleDiv.querySelector("div.output pre")?.innerHTML || "";
                // Convert <br> to newlines
                input = input.replace(/<br\s*\/?>(\n)?/gi, "\n");
                output = output.replace(/<br\s*\/?>(\n)?/gi, "\n");
                input = decode(input);
                output = decode(output);
                // Remove any remaining HTML tags
                input = input.replace(/<[^>]+>/g, "");
                output = output.replace(/<[^>]+>/g, "");
                return { input, output };
              });
            } else {
              // Fallback: try to find all <div class="input"><pre>...</pre></div> and <div class="output"><pre>...</pre></div>
              const inputs = doc.querySelectorAll(".input pre");
              const outputs = doc.querySelectorAll(".output pre");
              for (
                let i = 0;
                i < Math.max(inputs.length, outputs.length);
                i++
              ) {
                let input = inputs[i]?.innerHTML || "";
                let output = outputs[i]?.innerHTML || "";
                // Replace <br> and <br/> with real newlines
                input = input.replace(/<br\s*\/?>(\n)?/gi, "\n");
                output = output.replace(/<br\s*\/?>(\n)?/gi, "\n");
                // Replace &nbsp; with space
                input = input.replace(/&nbsp;/gi, " ");
                output = output.replace(/&nbsp;/gi, " ");
                // Remove all other HTML tags (but keep newlines)
                input = input.replace(/<[^>]+>/g, "");
                output = output.replace(/<[^>]+>/g, "");
                // Decode HTML entities (after tag removal)
                const decode = (str) => {
                  const txt = document.createElement('textarea');
                  txt.innerHTML = str;
                  return txt.value;
                };
                input = decode(input);
                output = decode(output);
                samples.push({ input, output });
              }
            }
          } catch (e) {
            // Ignore extraction errors
          }
        }
        setSamplesFromProblem(samples.filter((s) => s.input || s.output));
        // --- End Sample Extraction ---
      } catch (err) {
        console.error("Error loading problem:", err);
        setErrorProblem(`Failed to load problem: ${err.message}`);
        setProblem(null);
        setSamplesFromProblem([]); // Clear samples on error
      } finally {
        setLoadingProblem(false); // End loading
      }
    };
    fetchProblemDetails(); // Initiate problem fetching
  }, [problem_id]); // Re-run when problem_id changes

  // Handler for file input changes (for uploading code files)
  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCode(""); // Clear text area if a file is selected
    }
  };

  // Handler for language selection changes
  const handleLanguageChange = (e) => {
    const newLangId = e.target.value;
    setLanguage(newLangId);
    // Find the template for the newly selected language
    const currentLangTemplate = LANGUAGES.find(
      (l) => l.id === newLangId
    )?.template;
    if (!file) {
      // Only update textarea content with template if no file is currently uploaded
      setCode(currentLangTemplate || "");
    }
  };

  // Handler for submitting code
  const handleSubmit = async () => {
    // Check if user is logged in
    if (!authUser || !authUser.id) {
      setVerdict({
        status: "Error",
        message: "Please log in to submit solutions."
      });
      setShowVerdict(true);
      setTimeout(() => setShowVerdict(false), 4000);
      return;
    }

    // Prepare source code (from textarea or uploaded file)
    let sourceCode = code;
    if (file) {
      try {
        sourceCode = await file.text();
      } catch (e) {
        setVerdict({
          status: "Error",
          message: "Failed to read uploaded file."
        });
        setShowVerdict(true);
        setTimeout(() => setShowVerdict(false), 4000);
        setSubmitOpen(false);
        setFile(null);
        return;
      }
    }
    // Prepare payload with all required data
    const payload = {
      source_code: sourceCode,
      language,
      problem_id: problem.problem_id,
      user_id: authUser.id, // Now guaranteed to exist
      time_limit: problem.time_limit || DEFAULT_TIME_LIMIT_MS,
      memory_limit: problem.mem_limit || DEFAULT_MEMORY_LIMIT_KB,
      sample_input: samplesFromProblem.length > 0 ? samplesFromProblem[0].input : "",
      sample_output: samplesFromProblem.length > 0 ? samplesFromProblem[0].output : "",
      all_samples: samplesFromProblem // Send all samples for comprehensive testing
    };
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Submission failed: ${res.status}`);
      }
      const result = await res.json();
      
      // Map verdict codes to user-friendly names
      const verdictNames = {
        "AC": "Accepted",
        "WA": "Wrong Answer", 
        "TLE": "Time Limit Exceeded",
        "MLE": "Memory Limit Exceeded",
        "RE": "Runtime Error",
        "CE": "Compilation Error"
      };
      
      setVerdict({
        status: verdictNames[result.verdict] || result.verdict || "Unknown",
        message: result.message,
        testResults: result.testResults || [],
        submissionId: result.submissionId
      });
    } catch (err) {
      setVerdict({
        status: "Error",
        message: err.message || "Submission failed."
      });
    }
    setShowVerdict(true);
    setTimeout(() => setShowVerdict(false), 4000);
    setSubmitOpen(false);
    setFile(null);
  };

  // Prepare content for tabs dynamically based on `problem` state
  let stmtHTML = "",
    inputHTML = "",
    outputHTML = "";
  if (problem) {
    const rawFullHtmlFromDb = problem.statement_html || ""; // Get raw HTML statement
    if (rawFullHtmlFromDb) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawFullHtmlFromDb, "text/html");
        // Extract statement HTML: remove specific sections like header, input/output spec, samples, notes
        let contentNode = doc.querySelector(".problem-statement");
        if (!contentNode || !doc.body.contains(contentNode)) {
          // Fallback if .problem-statement class not found, use body content
          contentNode = doc.body;
        }
        if (contentNode) {
          const clonedNode = contentNode.cloneNode(true); // Clone to avoid modifying original DOM
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
          // Also remove headings that indicate other sections (heuristic to clean up content)
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
              if (
                keywordsToRemove.some((keyword) =>
                  childText.startsWith(keyword)
                )
              ) {
                child.remove();
              }
            }
          });
          stmtHTML = clonedNode.innerHTML.trim();
        } else {
          stmtHTML = rawFullHtmlFromDb; // If no specific content node, use full HTML
        }
      } catch (e) {
        console.error("Error cleaning statement_html:", e);
        stmtHTML = rawFullHtmlFromDb; // Fallback to raw HTML on error
      }
    }
    if (!stmtHTML) {
      stmtHTML =
        "<p class='italic text-gray-500'>Problem statement not available.</p>";
    }
    // Extract input specification HTML
    inputHTML = problem.input_spec || "";
    if ((!inputHTML || inputHTML.length < 20) && rawFullHtmlFromDb) {
      const extractedInput = extractSpecificSection(
        rawFullHtmlFromDb,
        ".input-specification",
        "Input(?: Format)?"
      );
      if (extractedInput) inputHTML = extractedInput;
    }
    // Wrap plain text input/output in a div for consistent styling if not already HTML
    if (
      inputHTML &&
      !inputHTML.trim().startsWith("<") &&
      !inputHTML.trim().endsWith(">")
    ) {
      inputHTML = `<div class="font-mono whitespace-pre-wrap p-2 bg-gray-800/50 rounded-md border border-gray-700">${inputHTML.replace(
        /\n/g,
        "<br/>"
      )}</div>`;
    } else if (!inputHTML) {
      inputHTML =
        "<p class='italic text-gray-500'>No specific input format provided. Check statement or examples.</p>";
    }
    // Extract output specification HTML
    outputHTML = problem.output_spec || "";
    if ((!outputHTML || outputHTML.length < 20) && rawFullHtmlFromDb) {
      const extractedOutput = extractSpecificSection(
        rawFullHtmlFromDb,
        ".output-specification",
        "Output(?: Format)?"
      );
      if (extractedOutput) outputHTML = extractedOutput;
    }
    // Wrap plain text input/output in a div for consistent styling if not already HTML
    if (
      outputHTML &&
      !outputHTML.trim().startsWith("<") &&
      !outputHTML.trim().endsWith(">")
    ) {
      outputHTML = `<div class="font-mono whitespace-pre-wrap p-2 bg-gray-800/50 rounded-md border border-gray-700">${outputHTML.replace(
        /\n/g,
        "<br/>"
      )}</div>`;
    } else if (!outputHTML) {
      outputHTML =
        "<p class='italic text-gray-500'>No specific output format provided. Check statement or examples.</p>";
    }
  }

  /**
   * Helper function to extract content of a specific div by class
   * OR by heading text if class not found.
   * Useful for pulling out specific sections from a larger HTML blob.
   * @param {string} fullHtml - The complete HTML string.
   * @param {string} classSelector - CSS selector for the target div (e.g., ".input-specification").
   * @param {string} headingTextRegexString - Regex string to match a heading if class selector fails.
   * @returns {string|null} The inner HTML of the found section, or null if not found.
   */
  function extractSpecificSection(
    fullHtml,
    classSelector,
    headingTextRegexString = null
  ) {
    if (!fullHtml) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, "text/html");
      // Try finding by class first
      let sectionNode = doc.querySelector(classSelector);
      if (sectionNode) {
        // If heading text regex is provided and matches first child, remove the heading
        if (
          headingTextRegexString &&
          sectionNode.firstElementChild &&
          sectionNode.firstElementChild.tagName.match(/^H[1-6]$/i) &&
          new RegExp(headingTextRegexString, "i").test(
            sectionNode.firstElementChild.textContent
          )
        ) {
          sectionNode.firstElementChild.remove();
        }
        return sectionNode.innerHTML.trim(); // Return content of the found node
      } else if (headingTextRegexString) {
        // If class selector fails, try finding by heading text
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
          let sibling = sectionHeading.nextElementSibling;
          // Collect all sibling elements until another heading or specific div is found
          while (sibling) {
            if (
              sibling.tagName.match(/^H[1-6]$/i) ||
              (sibling.tagName === "DIV" &&
                (sibling.classList.contains("sample-tests") ||
                  sibling.classList.contains("note") ||
                  sibling.classList.contains("input-specification") ||
                  sibling.classList.contains("output-specification") ||
                  sibling.classList.contains("section-title")))
            ) {
              break; // Stop if another section title or specific div is encountered
            }
            content += sibling.outerHTML; // Accumulate outer HTML
            sibling = sibling.nextElementSibling;
          }
          return content.trim() || null;
        }
      }
      return null; // No matching section found
    } catch (e) {
      console.error(
        `Error extracting section ${classSelector || headingTextRegexString}:`,
        e
      );
      return null;
    }
  }

  // --- Helper: HTML to Markdown conversion ---
  function htmlOrTextToMarkdown(htmlOrText) {
    if (!htmlOrText) return "";
    // Simple heuristic: if it looks like HTML, strip tags and convert to markdown-like text
    // For production, use a library like turndown for robust conversion
    if (/<[a-z][\s\S]*>/i.test(htmlOrText)) {
      // Replace <br> and <br/> with newlines
      let md = htmlOrText.replace(/<br\s*\/?>(\n)?/gi, "\n");
      // Replace <b>, <strong> with **text**
      md = md.replace(/<(b|strong)>(.*?)<\/\1>/gi, "**$2**");
      // Replace <i>, <em> with *text*
      md = md.replace(/<(i|em)>(.*?)<\/\1>/gi, "*$2*");
      // Replace <pre>(...)</pre> with code block
      md = md.replace(/<pre>([\s\S]*?)<\/pre>/gi, (m, code) => `\n\n\`\`\`\n${code.trim()}\n\`\`\`\n`);
      // Remove all other tags
      md = md.replace(/<[^>]+>/g, "");
      return md.trim();
    }
    return htmlOrText;
  }



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
        // Render <span class="tex-font-style-tt">...</span> as Codeforces-like inline code
        // if (
        //   domNode.type === 'tag' &&
        //   domNode.name === 'span' &&
        //   domNode.attribs &&
        //   domNode.attribs.class &&
        //   domNode.attribs.class.includes('tex-font-style-tt')
        // ) {
        //   return (
        //     <span className="inline-tt">
        //       {domToReact(domNode.children)}
        //     </span>
        //   );
        // }
        if (domNode.type === 'text') {
          return <>{parseMath(domNode.data)}</>;
        }
      },
    });
  }

  // Function to render content based on the active tab
  const renderTabContent = () => {
    if (!problem)
      return (
        <div className="text-center text-gray-400 py-8">
          Problem data is not available.
        </div>
      );
    switch (activeTab) {
      case "Statement":
        return <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(stmtHTML)}</div>;
      case "Input":
        return <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(inputHTML)}</div>;
      case "Output":
        return <div className="prose prose-invert max-w-none text-lg">{renderHtmlWithMath(outputHTML)}</div>;
      case "Examples":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {samplesFromProblem.length > 0 ? (
              <div className="w-full flex flex-col gap-6">
                {samplesFromProblem.map((sample, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 w-full border border-cyan-400/40 rounded-xl p-4 bg-gray-900/60" style={{minWidth:0}}>
                    {/* Sample Input */}
                    <div className="flex-1 min-w-0">
                      <div className="text-cyan-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Input</div>
                      <div className="relative">
                        <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-cyan-700/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.input}</pre>
                        <button
                          className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-700/80 hover:bg-cyan-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                          onClick={() => navigator.clipboard.writeText(sample.input)}
                          title="Copy sample input"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    {/* Sample Output */}
                    <div className="flex-1 min-w-0">
                      <div className="text-pink-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Output</div>
                      <div className="relative">
                        <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-pink-400/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.output}</pre>
                        <button
                          className="absolute top-2 right-2 px-2 py-1 text-xs bg-pink-700/80 hover:bg-pink-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                          onClick={() => navigator.clipboard.writeText(sample.output)}
                          title="Copy sample output"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full p-4 text-center rounded-lg border border-cyan-700/30 bg-gray-800/50">
                <p className="text-gray-400">
                  No sample test cases available.
                </p>
              </div>
            )}
          </motion.div>
        );
      case "Submit":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Submit Solution
              </h2>
            </div>

            {/* Language Selection */}
            <div className="flex flex-col gap-2">
              <label htmlFor="language-select" className="block text-base font-semibold text-cyan-200">
                Select Language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                className="w-1/2 p-3 bg-gray-800 border-2 border-cyan-700 rounded-lg text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 shadow-sm transition-colors duration-200 cursor-pointer appearance-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Code Editor */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
              <div className="relative">
                <label htmlFor="solution-box" className="block text-base font-semibold text-cyan-200 mb-3">
                  Source Code
                </label>
                <textarea
                  id="solution-box"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!file}
                  className="w-full h-80 p-4 bg-gray-900 text-cyan-100 font-mono text-sm resize-none rounded-xl border-2 border-cyan-700/60 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={file ? "File selected - code will be read from file" : "Write your solution here..."}
                />
              </div>
            </div>

            {/* File Upload Option */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
              <div className="relative">
                <label htmlFor="submit-file-upload" className="block text-base font-semibold text-purple-200 mb-3">
                  Upload Code File (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="submit-file-upload"
                    onChange={onFileChange}
                    accept=".cpp,.py,.java"
                    className="block text-sm text-purple-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer bg-gray-700 border-2 border-purple-700 rounded-md shadow-sm transition-colors duration-200"
                  />
                  {file && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-200 text-sm">
                        Selected: {file.name}
                      </span>
                      <button
                        onClick={() => {
                          setFile(null);
                          setCode(LANGUAGES.find((l) => l.id === language)?.template || "");
                        }}
                        className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                      >
                        (Clear)
                      </button>
                    </div>
                  )}
                </div>
                {file && (
                  <p className="text-xs text-gray-400 mt-2">
                    File content will be used instead of the code editor above.
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 hover:from-cyan-400 hover:to-pink-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-7.586 7.586A.5.5 0 009.172 14L2.5 7.328l1.414-1.414 5.758 5.758.707-.707L13.586 3.586z" />
              </svg>
              Submit Solution
            </motion.button>

            {/* Help Text */}
            <div className="text-sm text-gray-400 bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="flex items-center gap-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <strong>How to submit:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Select your programming language</li>
                <li>Write your solution in the code editor OR upload a code file</li>
                <li>Click "Submit Solution" to test against all sample cases</li>
                <li>Your submission will be saved and evaluated automatically</li>
                <li>Check "My Submissions" tab to view your submission history</li>
                <li>Supported file types: .cpp, .c, .py, .java, .js, .ts, .txt</li>
                <li>Login required for submissions</li>
              </ul>
            </div>

            <AnimatePresence>
              {showVerdict && verdict && (
                <div className="fixed top-8 right-8 z-50 max-w-md">
                  <div className={`px-6 py-4 rounded-xl shadow-lg border-2 text-lg font-bold flex flex-col gap-2 items-start ${verdict.status === "Accepted" ? "bg-green-900/90 border-green-400 text-green-200" : verdict.status === "Wrong Answer" ? "bg-pink-900/90 border-pink-400 text-pink-200" : verdict.status === "Compilation Error" ? "bg-yellow-900/90 border-yellow-400 text-yellow-200" : verdict.status === "Time Limit Exceeded" ? "bg-orange-900/90 border-orange-400 text-orange-200" : verdict.status === "Memory Limit Exceeded" ? "bg-purple-900/90 border-purple-400 text-purple-200" : "bg-red-900/90 border-red-400 text-red-200"}`}>
                    <span className="text-xl font-extrabold">{verdict.status}</span>
                    <span>{verdict.message}</span>
                    
                    {/* Test Results Display */}
                    {Array.isArray(verdict.testResults) && verdict.testResults.length > 0 && (
                      <div className="mt-3 text-sm max-h-64 overflow-y-auto w-full">
                        <div className="font-semibold mb-2 text-cyan-200">Test Results:</div>
                        {verdict.testResults.map((test, idx) => (
                          <div key={idx} className="mb-3 p-2 bg-black/30 rounded border border-gray-600">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Test {test.testCase}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                test.verdict === "AC" ? "bg-green-700 text-green-200" :
                                test.verdict === "WA" ? "bg-pink-700 text-pink-200" :
                                test.verdict === "TLE" ? "bg-orange-700 text-orange-200" :
                                test.verdict === "MLE" ? "bg-purple-700 text-purple-200" :
                                test.verdict === "RE" ? "bg-red-700 text-red-200" :
                                "bg-yellow-700 text-yellow-200"
                              }`}>
                                {test.verdict}
                              </span>
                            </div>
                            
                            {(test.executionTime || test.memoryUsed) && (
                              <div className="text-gray-300 text-xs mb-1 space-x-2">
                                {test.executionTime && <span>Time: {test.executionTime}ms</span>}
                                {test.memoryUsed && <span>Memory: {test.memoryUsed}KB</span>}
                              </div>
                            )}
                            
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-cyan-300 font-semibold">Input:</span>
                                <pre className="font-mono text-gray-200 whitespace-pre-wrap mt-1 p-1 bg-gray-800 rounded">{test.input || "(empty)"}</pre>
                              </div>
                              <div>
                                <span className="text-green-300 font-semibold">Expected:</span>
                                <pre className="font-mono text-gray-200 whitespace-pre-wrap mt-1 p-1 bg-gray-800 rounded">{test.expectedOutput || "(empty)"}</pre>
                              </div>
                              <div>
                                <span className="text-yellow-300 font-semibold">Your Output:</span>
                                <pre className="font-mono text-gray-200 whitespace-pre-wrap mt-1 p-1 bg-gray-800 rounded">{test.actualOutput || "(empty)"}</pre>
                              </div>
                              
                              {test.error && (
                                <div>
                                  <span className="text-red-300 font-semibold">Error:</span>
                                  <pre className="font-mono text-red-200 whitespace-pre-wrap mt-1 p-1 bg-red-900/30 rounded">{test.error}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      case "My Submissions":
        return problem.problem_id && authUser ? (
          <SubmissionHistory
            problemId={problem.problem_id}
            supabase={supabaseFromAuth}
            currentUser={authUser}
          />
        ) : (
          <div className="text-center text-gray-400 py-4">
            {authUser
              ? "Loading submissions..."
              : "Log in to view your submissions."}
          </div>
        );
      case "Test Runner":
        return <TestRunner />;
      default:
        return null;
    }
  };

  // Render loading state for the entire page
  if (loadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-20 rounded-lg blur-lg animate-pulse" />
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-20 rounded-lg blur-lg animate-pulse" />
          <div className="relative bg-gray-900 px-8 py-4 rounded-lg border border-cyan-700/50 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-lg font-medium">
                Loading Problem Details...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Render error state if problem loading failed
  if (errorProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400">
          <p className="text-xl p-8 bg-gray-900 rounded-lg border border-red-700 shadow-xl">
            {errorProblem}
          </p>
        </div>
      </div>
    );
  }
  // Render "Problem not found" if no problem data after loading
  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
          <p className="text-xl p-8 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
            Problem not found or could not be loaded.
          </p>
        </div>
      </div>
    );
  }
  // Main ProblemPage render
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Animated gradient background */}
        <div className="fixed inset-0 z-0 animate-gradient-bg bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#00c9ff] opacity-80 blur-2xl" />
        <div
          ref={mainRef}
          className="min-h-screen bg-gray-900/90 text-white pb-20 relative z-10"
        >
          {/* Neon glow effect for page header */}
          <div className="absolute inset-0 -z-10 opacity-30 blur-3xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              viewBox="0 0 1440 320"
            >
              <path
                fill="url(#gradient1)"
                d="M0,128L30,133.3C60,139,120,149,180,160C240,171,300,181,360,186.7C420,192,480,192,540,186.7C600,181,660,171,720,160C780,149,840,139,900,133.3C960,128,1020,128,1080,133.3C1140,139,1200,149,1260,160C1320,171,1380,181,1410,186.7L1440,192L1440,320L1080,320C1140,320,1200,320,1260,320C1320,320,1380,320,1410,320L1440,320Z"
              />
              <defs>
                <linearGradient
                  id="gradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#00c9ff", stopOpacity: 1 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#2c5364", stopOpacity: 1 }}
                  />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
            {/* Problem Title and Meta */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-md border-2 border-cyan-400/40 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] problem-section-animate relative overflow-hidden"
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
              <div className="relative">
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-2 leading-tight animate-gradient-text drop-shadow-lg">
                  {problem.title || "Untitled Problem"}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-cyan-200 mb-4 font-mono">
                  <p>
                    <strong>ID:</strong> {problem.external_id || "N/A"}
                  </p>
                  <p>
                    <strong>Time Limit:</strong>{" "}
                    {(problem.time_limit_ms || DEFAULT_TIME_LIMIT_MS) / 1000}s
                  </p>
                  <p>
                    <strong>Memory Limit:</strong>{" "}
                    {(problem.memory_limit_kb || DEFAULT_MEMORY_LIMIT_KB) /
                      1024}{" "}
                    MB
                  </p>
                  <p>
                    <strong>Difficulty:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        problem.difficulty === "Easy"
                          ? "text-green-400"
                          : problem.difficulty === "Medium"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {problem.difficulty || "N/A"}
                    </span>
                  </p>
                </div>
                {problem.description && (
                  <p className="text-cyan-100/90 text-lg font-light italic mb-2 animate-fade-in">
                    {problem.description}
                  </p>
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
                    className={`px-5 py-2 text-base font-semibold rounded-lg transition-all duration-300 relative overflow-hidden group shadow-md border-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 text-white border-cyan-300 shadow-lg scale-105"
                        : "text-cyan-200 hover:text-cyan-100 hover:bg-gray-800/60 border-transparent"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.span
                        layoutId="tab-underline"
                        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 rounded-b-lg shadow-lg"
                      />
                    )}
                    {tab}
                  </motion.button>
                ))}
              </div>

              {/* Tab Content Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800/40 rounded-xl p-8 backdrop-blur-md border border-cyan-700/50 shadow-lg problem-section-animate"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "Examples" ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {samplesFromProblem.length > 0 ? (
                          <div className="w-full flex flex-col gap-6">
                            {samplesFromProblem.map((sample, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-4 w-full border border-cyan-400/40 rounded-xl p-4 bg-gray-900/60" style={{minWidth:0}}>
                                {/* Sample Input */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-cyan-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Input</div>
                                  <div className="relative">
                                    <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-cyan-700/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.input}</pre>
                                    <button
                                      className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-700/80 hover:bg-cyan-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                      onClick={() => navigator.clipboard.writeText(sample.input)}
                                      title="Copy sample input"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                                {/* Sample Output */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-pink-300 font-mono text-xs mb-1 tracking-widest uppercase">Sample Output</div>
                                  <div className="relative">
                                    <pre className="block w-full font-mono text-base bg-gray-900/80 rounded-md border border-pink-400/40 p-3 whitespace-pre-wrap overflow-x-auto select-all" style={{minHeight:'2.5em'}}>{sample.output}</pre>
                                    <button
                                      className="absolute top-2 right-2 px-2 py-1 text-xs bg-pink-700/80 hover:bg-pink-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                                      onClick={() => navigator.clipboard.writeText(sample.output)}
                                      title="Copy sample output"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="col-span-full p-4 text-center rounded-lg border border-cyan-700/30 bg-gray-800/50">
                            <p className="text-gray-400">
                              No sample test cases available.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      renderTabContent()
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Submission area (initially hidden) */}
            {submitOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="mt-8 p-6 bg-gray-800/40 rounded-xl border border-cyan-700/50 shadow-lg problem-section-animate"
              >
                <h2 className="text-xl font-bold text-cyan-200 mb-4">
                  Submit Your Solution
                </h2>
                <motion.button
                  onClick={() => setSubmitOpen(!submitOpen)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
                <div className="mb-4">
                  <label
                    htmlFor="solution"
                    className="block text-sm font-medium text-cyan-200 mb-2"
                  >
                    Solution
                  </label>
                  <textarea
                    id="solution"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-32 p-3 bg-gray-900 text-cyan-100 font-mono text-sm resize-none rounded-md border-2 border-cyan-700/60 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    placeholder="Paste your code solution here..."
                    disabled={!!file} // Disable if a file is uploaded
                  />
                </div>

                {/* Language and File Upload Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Language Selector */}
                  <div className="relative">
                    <label
                      htmlFor="language-select"
                      className="block text-sm font-medium text-cyan-200 mb-1"
                    >
                      Language
                    </label>
                    <select
                      id="language-select"
                      value={language}
                      onChange={handleLanguageChange}
                      className="w-full p-2.5 bg-gray-700 border-2 border-cyan-700 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 shadow-sm transition-colors duration-200 cursor-pointer appearance-none pr-8"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.5rem center",
                        backgroundSize: "1.5em 1.5em",
                      }}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* File Upload (Optional) */}
                  <div className="relative">
                    <label
                      htmlFor="file-upload"
                      className="block text-sm font-medium text-cyan-200 mb-1"
                    >
                      Upload File (Optional)
                    </label>
                    <input
                      type="file"
                      id="file-upload"
                      onChange={onFileChange}
                      className="block w-full text-sm text-cyan-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer bg-gray-700 border-2 border-cyan-700 rounded-md shadow-sm transition-colors duration-200"
                    />
                    {file && (
                      <p className="text-cyan-200 text-xs mt-1">
                        Selected: {file.name}
                        <button
                          onClick={() => {
                            setFile(null);
                            setCode(
                              LANGUAGES.find((l) => l.id === language)
                                ?.template || ""
                            ); // Restore template if file cleared
                          }}
                          className="ml-2 text-pink-400 hover:text-pink-300"
                        >
                          (Clear)
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Submit and Cancel */}
                <div className="flex justify-end gap-4">
                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 hover:from-cyan-400 hover:to-pink-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-7.586 7.586A.5.5 0 009.172 14L2.5 7.328l1.414-1.414 5.758 5.758.707-.707L13.586 3.586z" />
                    </svg>
                    Submit Solution
                  </motion.button>

                  <motion.button
                    onClick={() => setSubmitOpen(false)}
                    className="px-6 py-3 rounded-lg font-semibold text-cyan-200 bg-gray-700 hover:bg-gray-600 border-2 border-cyan-700/60 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v-2m3 2v-4m3 2v-6m2 10H7m-2-7h14a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-10a2 2 0 00-2-2h-2M4 7V4a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1"
                      />
                    </svg>
                    Close
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Render verdict status animation if visible */}
            <AnimatePresence>
              {showVerdict && verdict && (
                <StatusAnimation
                  status={verdict.status}
                  message={verdict.message}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
