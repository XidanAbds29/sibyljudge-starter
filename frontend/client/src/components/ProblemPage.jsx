import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TABS = ["Statement", "Input", "Output", "Examples"];
const LANGUAGES = [
  { id: "cpp", name: "C++ (GCC 11)" },
  { id: "python", name: "Python 3.10" },
  { id: "java", name: "Java 17" },
];

function SampleExample({ html }) {
  const ref = useRef();

  useEffect(() => {
    const pres = ref.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.parentNode.querySelector(".copy-btn")) return;
      // wrap in relative container
      const wrapper = document.createElement("div");
      wrapper.className = "relative group mb-4";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      // copy button
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
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);

  // Fetch problem and wrap HTML
  useEffect(() => {
    fetch(`http://localhost:5000/api/problems/${external_id}`)
      .then((r) => r.json())
      .then((data) => {
        setProblem(data);
        const div = document.createElement("div");
        div.innerHTML = data.statement_html;
        setWrapper(div);
      })
      .catch(() => setProblem(null));
  }, [external_id]);

  if (!problem || !wrapper) {
    return <div className="p-10 text-center text-sybil-text">Loading…</div>;
  }

  // Extract sections
  const inputSpec = wrapper.querySelector(".input-specification");
  let stmtHTML = "";
  if (inputSpec) {
    let node = wrapper.firstChild;
    while (node && node !== inputSpec) {
      stmtHTML += node.outerHTML ?? node.textContent;
      node = node.nextSibling;
    }
  } else {
    stmtHTML = wrapper.innerHTML;
  }
  const inputHTML = inputSpec?.outerHTML || "<p>No input specification.</p>";
  const outputSpec = wrapper.querySelector(".output-specification");
  const outputHTML = outputSpec?.outerHTML || "<p>No output specification.</p>";
  const sampleHTMLs = Array.from(wrapper.querySelectorAll(".sample-test")).map(
    (n) => n.outerHTML
  );

  // Handlers
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setCode("");
  };
  const handleSubmit = () => {
    // TODO: send { external_id, language, code/file } to backend
    console.log("Submit:", { external_id, language, code, file });
    setSubmitOpen(false);
  };

  // Render tab content
  const renderTab = () => {
    switch (activeTab) {
      case "Statement":
        return (
          <>
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-sybil-accent text-sybil-bg rounded">
                Difficulty: {problem.difficulty || "Unrated"}
              </span>
              <span className="px-2 py-1 bg-sybil-accent text-sybil-bg rounded">
                Time: {problem.time_limit / 1000}s
              </span>
              <span className="px-2 py-1 bg-sybil-accent text-sybil-bg rounded">
                Memory: {problem.mem_limit / 1024}MB
              </span>
            </div>
            <div
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: stmtHTML }}
            />
          </>
        );

      case "Input":
        return (
          <div
            className="prose prose-invert"
            dangerouslySetInnerHTML={{ __html: inputHTML }}
          />
        );

      case "Output":
        return (
          <div
            className="prose prose-invert"
            dangerouslySetInnerHTML={{ __html: outputHTML }}
          />
        );

      case "Examples":
        return sampleHTMLs.length ? (
          <div>
            {sampleHTMLs.map((html, idx) => (
              <SampleExample key={idx} html={html} />
            ))}
          </div>
        ) : (
          <p className="text-sybil-text">No examples available.</p>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-sybil-bg p-6 border-b border-sybil-accent">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-sybil-accent text-sybil-panel rounded hover:shadow-sybil-glow transition"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-sybil-accent">
          {problem.title}
        </h1>
        <button
          onClick={() => setSubmitOpen(true)}
          className="px-3 py-1 bg-sybil-accent text-sybil-panel rounded hover:shadow-sybil-glow transition"
        >
          Submit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-sybil-panel">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "flex-1 py-3 text-center font-medium transition " +
              (activeTab === tab
                ? "border-b-4 border-sybil-accent text-sybil-accent"
                : "text-sybil-text/70 hover:text-sybil-text")
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-sybil-panel p-6">{renderTab()}</div>

      {/* Submission Modal */}
      {submitOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-sybil-panel text-sybil-text p-6 rounded-2xl shadow-2xl w-full max-w-lg relative">
            <button
              onClick={() => setSubmitOpen(false)}
              className="absolute top-4 right-4 text-sybil-accent hover:shadow-sybil-glow transition"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-sybil-accent mb-4">
              Submit Solution
            </h2>

            <label className="block mb-3">
              <span className="text-sybil-text">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1 p-2 bg-sybil-bg border border-sybil-accent rounded"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sybil-text">Paste Code</span>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!file}
                rows={8}
                className="w-full mt-1 p-2 bg-sybil-bg border border-sybil-accent rounded font-mono"
              />
            </label>

            <label className="block mb-4">
              <span className="text-sybil-text">Or Upload File</span>
              <input
                type="file"
                accept=".cpp,.py,.java,.js"
                onChange={onFileChange}
                className="block mt-1"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSubmitOpen(false)}
                className="px-4 py-2 bg-sybil-text/20 rounded hover:bg-sybil-text/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded hover:shadow-sybil-glow transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
