import React, { useState, useEffect } from "react";
import bgImage from "../assets/bg.png";

// Gimmick problems for selection (from ProblemList.jsx)
const GIMMICK_PROBLEMS = [
	{
		problem_id: 1,
		external_id: "CF123A",
		title: "Psycho-Pass Paradox",
		source_name: "Codeforces",
		difficulty: 1200,
		time_limit: 2000,
		mem_limit: 256 * 1024,
		tags: ["math", "greedy"],
	},
	{
		problem_id: 2,
		external_id: "AT456B",
		title: "Dominator's Dilemma",
		source_name: "AtCoder",
		difficulty: 1600,
		time_limit: 2000,
		mem_limit: 256 * 1024,
		tags: ["dp", "bitmask"],
	},
	{
		problem_id: 3,
		external_id: "CC789C",
		title: "Sibyl System Simulation",
		source_name: "CodeChef",
		difficulty: 1800,
		time_limit: 3000,
		mem_limit: 512 * 1024,
		tags: ["simulation", "implementation"],
	},
];

const ContestCreatePage = () => {
	const [step, setStep] = useState(1);
	const [contestInfo, setContestInfo] = useState({
		name: "",
		start_time: "",
		end_time: "",
	});
	const [selectedProblems, setSelectedProblems] = useState([]);
	const [problems, setProblems] = useState([]);

	useEffect(() => {
		// In real app, fetch from backend. Here, use gimmick data.
		setProblems(GIMMICK_PROBLEMS);
	}, []);

	const toggleProblem = (pid) => {
		setSelectedProblems((prev) =>
			prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
		);
	};

	return (
		<div
			className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased"
			style={{
				backgroundImage: `url(${bgImage})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				position: "relative",
			}}
		>
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
			<div className="pointer-events-none fixed inset-0 z-0">
				<div className="absolute inset-0 rounded-3xl overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-pink-400/10 w-full h-full"></div>
					<div className="absolute inset-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.18)_0,transparent_70%)] animate-pulse"></div>
					<div className="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_70%_80%,rgba(255,0,234,0.12)_0,transparent_70%)]"></div>
				</div>
			</div>
			<div className="relative z-10 container mx-auto px-4 py-24">
				<div className="max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-700/50 shadow-cyan-500/20 p-10">
					<div className="flex items-center gap-6 mb-10">
						<div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 shadow-lg border-4 border-cyan-400 animate-pulse">
							<svg
								className="w-12 h-12 text-gray-900"
								viewBox="0 0 64 32"
								fill="none"
							>
								<rect
									x="2"
									y="12"
									width="60"
									height="8"
									rx="4"
									fill="#00fff7"
									opacity="0.18"
								/>
								<rect x="8" y="14" width="48" height="4" rx="2" fill="#00fff7" />
								<rect x="54" y="10" width="6" height="12" rx="3" fill="#ff00ea" />
								<circle cx="12" cy="16" r="3" fill="#fffb00" />
								<rect x="18" y="15" width="6" height="2" rx="1" fill="#fffb00" />
							</svg>
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-extrabold text-cyan-400 tracking-wide mb-1">
								Create Virtual Contest
							</h1>
							<div className="text-xs text-yellow-300 font-mono tracking-widest bg-yellow-900/30 px-3 py-1 rounded-lg border border-yellow-400/30 inline-block shadow">
								SIBYL SYSTEM
							</div>
						</div>
					</div>
					{/* Tab/Section 1: Contest Info */}
					{step === 1 && (
						<section>
							<h2 className="text-xl font-bold text-pink-400 mb-6 tracking-wide">
								Contest Info
							</h2>
							<form>
								<input
									className="block w-full bg-gray-800/80 border-2 border-cyan-400 rounded-lg text-lg text-cyan-100 px-5 py-3 mb-6 focus:outline-none focus:border-pink-400 shadow transition"
									type="text"
									placeholder="Contest Name"
									value={contestInfo.name}
									onChange={(e) =>
										setContestInfo({ ...contestInfo, name: e.target.value })
									}
								/>
								<input
									className="block w-full bg-gray-800/80 border-2 border-cyan-400 rounded-lg text-lg text-cyan-100 px-5 py-3 mb-6 focus:outline-none focus:border-pink-400 shadow transition"
									type="datetime-local"
									placeholder="Start Time"
									value={contestInfo.start_time}
									onChange={(e) =>
										setContestInfo({ ...contestInfo, start_time: e.target.value })
									}
								/>
								<input
									className="block w-full bg-gray-800/80 border-2 border-cyan-400 rounded-lg text-lg text-cyan-100 px-5 py-3 mb-6 focus:outline-none focus:border-pink-400 shadow transition"
									type="datetime-local"
									placeholder="End Time"
									value={contestInfo.end_time}
									onChange={(e) =>
										setContestInfo({ ...contestInfo, end_time: e.target.value })
									}
								/>
							</form>
							<button
								className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.7)] focus:outline-none focus:ring-4 focus:ring-pink-500/50 mt-2"
								onClick={() => setStep(2)}
							>
								Next: Select Problems
							</button>
						</section>
					)}
					{/* Tab/Section 2: Problem Selection */}
					{step === 2 && (
						<section>
							<h2 className="text-xl font-bold text-yellow-300 mb-6 tracking-wide">
								Select Problems
							</h2>
							<div className="mb-6">
								<div className="grid gap-4">
									{problems.map((p) => (
										<label
											key={p.problem_id}
											className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${
													selectedProblems.includes(p.problem_id)
														? "border-pink-400 bg-gray-800/80 shadow-lg"
														: "border-cyan-700/40 bg-gray-900/60 hover:border-cyan-400"
												}
                      `}
										>
											<input
												type="checkbox"
												checked={selectedProblems.includes(p.problem_id)}
												onChange={() => toggleProblem(p.problem_id)}
												className="accent-cyan-400 w-5 h-5 mt-1"
											/>
											<div className="flex-1">
												<div className="flex flex-wrap gap-2 items-center mb-1">
													<span className="text-cyan-300 font-semibold text-lg">
														{p.title}
													</span>
													<span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded-full border border-gray-700">
														{p.source_name}
													</span>
													<span className="px-2 py-0.5 text-xs bg-pink-700/30 text-pink-300 rounded-full border border-pink-600/50">
														Rating: {p.difficulty}
													</span>
													<span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded-full border border-gray-700">
														Time: {p.time_limit / 1000}s
													</span>
													<span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded-full border border-gray-700">
														Memory: {p.mem_limit / 1024}MB
													</span>
												</div>
												{p.tags?.length > 0 && (
													<div className="flex flex-wrap gap-1.5 mt-1">
														{p.tags.map((tag, i) => (
															<span
																key={i}
																className="px-2 py-0.5 text-xs bg-sky-800/40 text-sky-300 rounded-full border border-sky-700/60"
															>
																{tag}
															</span>
														))}
													</div>
												)}
											</div>
										</label>
									))}
								</div>
								{selectedProblems.length > 0 && (
									<div className="mt-6 text-cyan-300 text-sm">
										<span className="font-semibold">Selected Problems:</span>{" "}
										{selectedProblems.length}
									</div>
								)}
							</div>
							<div className="flex flex-col sm:flex-row gap-4">
								<button
									className="w-full sm:w-auto bg-gradient-to-r from-gray-700 to-cyan-700 hover:from-gray-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition hover:scale-105"
									onClick={() => setStep(1)}
								>
									Back
								</button>
								<button
									className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition hover:scale-105"
									/* onClick={handleCreateContest} */
									disabled={selectedProblems.length === 0}
								>
									Create Contest
								</button>
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
};

export default ContestCreatePage;