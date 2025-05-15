import React from "react";
import ProblemList from "./components/ProblemList";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white p-4 text-center text-xl font-bold">
        SibylJudge - Codeforces Problems
      </header>
      <ProblemList />
    </div>
  );
}

export default App;
