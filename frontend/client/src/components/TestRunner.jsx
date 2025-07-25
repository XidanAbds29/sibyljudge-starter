import React, { useState } from "react";
import { motion } from "framer-motion";

const LANGUAGES = [
  {
    id: "cpp",
    name: "GNU G++14 (C++17)",
    template: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  },
  {
    id: "python",
    name: "Python 3.13",
    template: "# Your Python solution here\n\ndef solve():\n    # Read input\n    # Process and solve\n    # Print output\n    pass\n\nif __name__ == '__main__':\n    solve()",
  },
  {
    id: "java",
    name: "Java 23",
    template: "import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Your code here\n        scanner.close();\n    }\n}",
  },
];

export default function TestRunner() {
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [file, setFile] = useState(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState("");

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLangId = e.target.value;
    setLanguage(newLangId);
    // Update code template for the new language only if no file is selected
    if (!file) {
      const selectedLang = LANGUAGES.find(l => l.id === newLangId);
      if (selectedLang) {
        setCode(selectedLang.template);
      }
    }
  };

  // Handle file input changes
  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCode(""); // Clear text area if a file is selected
    }
  };

  const runTest = async () => {
    // Prepare source code (from textarea or uploaded file)
    let sourceCode = code;
    if (file) {
      try {
        sourceCode = await file.text();
      } catch (e) {
        setError("Failed to read uploaded file");
        setOutput(`Error: Failed to read uploaded file - ${e.message}`);
        setTestResult(null);
        return;
      }
    }

    if (!sourceCode.trim()) {
      setError("Please write some code or upload a file!");
      setOutput("");
      setTestResult(null);
      return;
    }

    setIsRunning(true);
    setError("");
    setOutput("Running your code...");
    setTestResult(null);
    
      try {
        const response = await fetch("/api/submissions/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            language, 
            code: sourceCode, 
            input 
          }),
        });      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      setTestResult(result);
      
      // Format output based on result
      if (result.compilationError) {
        setOutput(result.error || "Compilation failed");
        setError("Compilation Error");
      } else if (result.runtimeError) {
        setOutput(result.error || "Runtime error occurred");
        setError("Runtime Error");
      } else if (result.timeLimitExceeded) {
        setOutput(result.output || "");
        setError("Time Limit Exceeded (5s)");
      } else if (result.memoryLimitExceeded) {
        setOutput(result.output || "");
        setError("Memory Limit Exceeded");
      } else {
        setOutput(result.output || "(no output)");
        setError("");
      }
      
    } catch (err) {
      console.error("Test runner error:", err);
      setError("Failed to run test");
      setOutput(`Error: ${err.message}`);
      setTestResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
    setTestResult(null);
    setFile(null);
    // Reset to current language template
    const selectedLang = LANGUAGES.find(l => l.id === language);
    if (selectedLang) {
      setCode(selectedLang.template);
    }
  };

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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Test Runner
        </h2>
        <button
          onClick={clearAll}
          className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
        >
          Clear All
        </button>
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
          <label htmlFor="code-editor" className="block text-base font-semibold text-cyan-200 mb-3">
            Source Code
          </label>
          <textarea
            id="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isRunning || !!file}
            className="w-full h-80 p-4 bg-gray-900 text-cyan-100 font-mono text-sm resize-none rounded-xl border-2 border-cyan-700/60 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={file ? "File selected - code will be read from file" : "Write your code here..."}
          />
        </div>
      </div>

      {/* File Upload Option */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
        <div className="relative">
          <label htmlFor="file-upload" className="block text-base font-semibold text-purple-200 mb-3">
            Upload Code File (Optional)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
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
                    const selectedLang = LANGUAGES.find(l => l.id === language);
                    if (selectedLang) {
                      setCode(selectedLang.template);
                    }
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

      {/* Input/Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
          <div className="relative">
            <h3 className="text-cyan-400 mb-3 flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Test Input
            </h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isRunning}
              className="w-full h-48 p-4 bg-gray-800/70 border border-cyan-700/60 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-gray-300 placeholder-gray-500"
              placeholder="Enter test input here... (leave empty if no input needed)"
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-400 flex items-center gap-2 font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Output
              </h3>
              {error && (
                <span className="px-2 py-1 text-xs font-semibold bg-red-900/50 text-red-300 border border-red-600/50 rounded">
                  {error}
                </span>
              )}
            </div>
            <div
              className={`w-full h-48 p-4 bg-gray-800/70 border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap ${
                error 
                  ? "border-red-700/60 text-red-300" 
                  : "border-green-700/60 text-gray-300"
              } ${
                isRunning ? "animate-pulse opacity-60" : ""
              } transition-all duration-300`}
            >
              {output || "Output will appear here..."}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Stats */}
      {testResult && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        >
          <div className="text-center">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Status</div>
            <div className="text-green-400 font-semibold">Success</div>
          </div>
          {testResult.executionTime && (
            <div className="text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wide">Time</div>
              <div className="text-cyan-400 font-semibold">{testResult.executionTime}ms</div>
            </div>
          )}
          {testResult.memoryUsed && (
            <div className="text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wide">Memory</div>
              <div className="text-purple-400 font-semibold">{testResult.memoryUsed}KB</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Language</div>
            <div className="text-yellow-400 font-semibold">{LANGUAGES.find(l => l.id === language)?.name || language.toUpperCase()}</div>
          </div>
        </motion.div>
      )}

      {/* Run Button */}
      <motion.button
        onClick={runTest}
        disabled={isRunning}
        whileHover={{ scale: isRunning ? 1 : 1.02 }}
        whileTap={{ scale: isRunning ? 1 : 0.98 }}
        className={`w-full px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 text-lg ${
          isRunning
            ? "bg-cyan-700/50 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
        } text-white transition-all duration-300`}
      >
        {isRunning ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
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
            Running Test...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Run Test
          </>
        )}
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
          <strong>How to use:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-6">
          <li>Select your programming language</li>
          <li>Write your code in the source code editor OR upload a code file</li>
          <li>Enter test input (if needed) in the input box</li>
          <li>Click "Run Test" to execute your code with the provided input</li>
          <li>View the output and execution statistics</li>
          <li>Time limit: 5 seconds, Memory limit: 256 MB</li>
          <li>No login required - test your code freely!</li>
          <li>Supported file types: .cpp, .py, .java</li>
        </ul>
      </div>
    </motion.div>
  );
}
