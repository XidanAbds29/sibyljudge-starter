import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import { useAuth } from "../components/AuthContext";
import { gsap } from "gsap";

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
    name: "C++ (GCC 11)",
    template:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
    monacoLang: "cpp",
  },
  {
    id: "python",
    name: "Python 3.10",
    template:
      "# Your Python solution here\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()",
    monacoLang: "python",
  },
  {
    id: "java",
    name: "Java 17",
    template:
      "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
    monacoLang: "java",
  },
];

const DEFAULT_TIME_LIMIT_MS = 2000;
const DEFAULT_MEMORY_LIMIT_KB = 262144;

function SampleTest({ input, output }) {
  return (
    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
      <div className="font-semibold text-gray-300">Sample Test</div>
      <div className="mt-2">
        <div className="font-medium text-gray-200">Input:</div>
        <pre className="p-2 bg-gray-900 rounded-md overflow-x-auto">
          {input}
        </pre>
      </div>
      <div className="mt-2">
        <div className="font-medium text-gray-200">Output:</div>
        <pre className="p-2 bg-gray-900 rounded-md overflow-x-auto">
          {output}
        </pre>
      </div>
    </div>
  );
}

function ParsedHtmlContent({ htmlContent, className }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

const ContestProblemPage = () => {
  const { contestId, problemId } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Statement");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState([]);
  const [submissionId, setSubmissionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);

  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef(null);
  const mainRef = useRef();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/contests/${contestId}/problem/${problemId}`
        );
        if (!res.ok) throw new Error("Failed to fetch problem");
        const data = await res.json();
        setProblem(data);
        setCode(data.sampleSolution || "");
        setTestCases(data.sampleTestCases || []);
      } catch (err) {
        setError(err.message);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [contestId, problemId]);

  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
    }
  }, [problem]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const selectedLanguage = LANGUAGES.find((l) => l.id === lang);
    if (selectedLanguage) {
      setCode(selectedLanguage.template);
    }
  };

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleRunCode = async () => {
    if (!user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }
    setIsSubmitting(true);
    setOutput("");
    try {
      const res = await fetch(
        `/api/contests/${contestId}/problems/${problemId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            language,
            code,
            testCases,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to run code");
      const data = await res.json();
      setResults(data.results || []);
      setOutput(data.output || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }
    setIsSubmitting(true);
    setOutput("");
    try {
      const res = await fetch(
        `/api/contests/${contestId}/problems/${problemId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            language,
            code,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to submit code");
      const data = await res.json();
      setSubmissionId(data.submissionId);
      setOutput(data.output || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-cyan-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!problem)
    return <div className="p-8 text-gray-400">Problem not found.</div>;

  return (
    <div
      ref={mainRef}
      className="max-w-3xl mx-auto p-8 bg-gray-900 text-gray-100 rounded-xl shadow-lg mt-10"
    >
      <h1 className="text-2xl font-bold text-cyan-400 mb-4">{problem.title}</h1>
      <div className="mb-4 text-gray-300">{problem.statement}</div>
      <div className="flex space-x-4 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedTab === tab
                ? "bg-cyan-500 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mb-4">
        {selectedTab === "Statement" && (
          <ParsedHtmlContent
            htmlContent={problem.statement}
            className="prose"
          />
        )}
        {selectedTab === "Input" && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-300">Input Format</div>
            <div className="mt-2">
              <ParsedHtmlContent
                htmlContent={problem.inputFormat}
                className="prose"
              />
            </div>
          </div>
        )}
        {selectedTab === "Output" && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-300">Output Format</div>
            <div className="mt-2">
              <ParsedHtmlContent
                htmlContent={problem.outputFormat}
                className="prose"
              />
            </div>
          </div>
        )}
        {selectedTab === "Examples" && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-300">Examples</div>
            {problem.examples && problem.examples.length > 0 ? (
              problem.examples.map((example, index) => (
                <SampleTest
                  key={index}
                  input={example.input}
                  output={example.output}
                />
              ))
            ) : (
              <div className="mt-2 text-gray-400">No examples available.</div>
            )}
          </div>
        )}
        {selectedTab === "Submissions" && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-300">Submissions</div>
            {/* Render submissions table or list here */}
          </div>
        )}
        {selectedTab === "Test Runner" && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-300">Test Runner</div>
            <div className="mt-2">
              <MonacoEditor
                height={editorHeight}
                language="cpp"
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  selectOnLineNumbers: true,
                  automaticLayout: true,
                }}
                ref={editorRef}
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleRunCode}
                className="flex-1 px-4 py-2 bg-cyan-500 text-gray-900 rounded-lg font-semibold transition-all hover:bg-cyan-600"
              >
                {isSubmitting ? "Running..." : "Run Code"}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-green-500 text-gray-900 rounded-lg font-semibold transition-all hover:bg-green-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Code"}
              </button>
            </div>
            {output && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <div className="font-semibold text-gray-300">Output</div>
                <pre className="mt-2 p-2 bg-gray-800 rounded-md overflow-x-auto">
                  {output}
                </pre>
              </div>
            )}
            {results.length > 0 && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <div className="font-semibold text-gray-300">Test Results</div>
                <div className="mt-2 space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md ${
                        result.passed
                          ? "bg-green-500 text-gray-900"
                          : "bg-red-500 text-gray-900"
                      }`}
                    >
                      <div className="font-medium">
                        Test Case {index + 1}:{" "}
                        {result.passed ? "Passed" : "Failed"}
                      </div>
                      {!result.passed && result.error && (
                        <div className="mt-1 text-sm">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestProblemPage;
