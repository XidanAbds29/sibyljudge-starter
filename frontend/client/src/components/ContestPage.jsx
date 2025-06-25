import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import bgImage from "../assets/bg.png";

const TABS = ["Problems", "Standings", "Participants"];

const GIMMICK_CONTESTS = [
	{
		contest_id: "psycho-001",
		name: "Sibyl System Grand Challenge",
		start_time: "2024-06-01T18:00",
		end_time: "2024-06-01T21:00",
		status: "Upcoming",
		problems: [
			{ title: "Psycho-Pass Paradox", id: "CF123A" },
			{ title: "Dominator's Dilemma", id: "AT456B" },
		],
		participants: [
			"Akane Tsunemori",
			"Shinya Kogami",
			"Shogo Makishima",
		],
	},
	{
		contest_id: "psycho-002",
		name: "Dominator Coding Trials",
		start_time: "2024-05-28T15:00",
		end_time: "2024-05-28T18:00",
		status: "Ongoing",
		problems: [
			{ title: "Sibyl System Simulation", id: "CC789C" },
		],
		participants: [
			"Yayoi Kunizuka",
			"Nobuchika Ginoza",
		],
	},
	{
		contest_id: "psycho-003",
		name: "Inspector Akane's Invitational",
		start_time: "2024-05-20T12:00",
		end_time: "2024-05-20T15:00",
		status: "Finished",
		problems: [
			{ title: "Latent Criminal Analysis", id: "PP001" },
			{ title: "Hue Calculation", id: "PP002" },
		],
		participants: [
			"Akane Tsunemori",
			"Shion Karanomori",
			"Tomomi Masaoka",
		],
	},
];

const ContestPage = () => {
	const { contestId } = useParams();
	const [activeTab, setActiveTab] = useState(TABS[0]);
	const [contest, setContest] = useState(null);

	useEffect(() => {
		// Demo: find contest from gimmick data
		setContest(GIMMICK_CONTESTS.find(c => c.contest_id === contestId));
	}, [contestId]);

	if (!contest) return (
		<div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400 font-['Orbitron',_sans-serif]">
			<span className="text-2xl animate-pulse">Loading...</span>
		</div>
	);

	return (
		<div
			className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased"
			style={{
				backgroundImage: `url(${bgImage})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				position: "relative"
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
							<svg className="w-12 h-12 text-gray-900" viewBox="0 0 64 32" fill="none">
								<rect x="2" y="12" width="60" height="8" rx="4" fill="#00fff7" opacity="0.18"/>
								<rect x="8" y="14" width="48" height="4" rx="2" fill="#00fff7"/>
								<rect x="54" y="10" width="6" height="12" rx="3" fill="#ff00ea"/>
								<circle cx="12" cy="16" r="3" fill="#fffb00" />
								<rect x="18" y="15" width="6" height="2" rx="1" fill="#fffb00"/>
							</svg>
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-extrabold text-cyan-400 tracking-wide mb-1" style={{ textShadow: '0 0 12px #00fff7, 0 0 20px #00fff7' }}>
								{contest.name}
							</h1>
							<div className="text-xs text-yellow-300 font-mono tracking-widest bg-yellow-900/30 px-3 py-1 rounded-lg border border-yellow-400/30 inline-block shadow" style={{ textShadow: '0 0 8px #fffb00' }}>
								Contest ID: {contestId}
							</div>
							<div className="mt-2 text-sm text-gray-300">
								<span className="mr-4">
									<span className="font-semibold text-cyan-400">Start:</span>{" "}
									{new Date(contest.start_time).toLocaleString()}
								</span>
								<span>
									<span className="font-semibold text-pink-400">End:</span>{" "}
									{new Date(contest.end_time).toLocaleString()}
								</span>
							</div>
						</div>
					</div>
					<div className="flex space-x-4 mb-8">
						{TABS.map(tab => (
							<button
								key={tab}
								className={`px-6 py-2 rounded-lg font-bold text-lg transition-all border-2
                  ${activeTab === tab
									? "bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-pink-400 shadow-lg"
									: "bg-gray-800/80 text-cyan-300 border-cyan-700 hover:bg-gray-700/80 hover:border-cyan-400"}
                `}
								onClick={() => setActiveTab(tab)}
							>
								{tab}
							</button>
						))}
					</div>
					<div className="min-h-[180px]">
						{activeTab === "Problems" && (
							<section>
								<h2 className="text-xl font-bold text-cyan-400 mb-4">Problems</h2>
								<ul className="space-y-3">
									{contest.problems?.map((p, i) => (
										<li key={i} className="bg-gray-800/70 rounded-lg px-5 py-3 text-cyan-200 border border-cyan-700/40">
											<span className="font-semibold">{p.title}</span>
											<span className="ml-3 text-xs text-gray-400">({p.id})</span>
										</li>
									))}
									{!contest.problems?.length && (
										<li className="text-gray-400">No problems listed.</li>
									)}
								</ul>
							</section>
						)}
						{activeTab === "Standings" && (
							<section>
								<h2 className="text-xl font-bold text-pink-400 mb-4">Standings</h2>
								<div className="text-gray-400">Standings will be displayed here.</div>
							</section>
						)}
						{activeTab === "Participants" && (
							<section>
								<h2 className="text-xl font-bold text-yellow-300 mb-4">Participants</h2>
								<ul className="space-y-2">
									{contest.participants?.map((p, i) => (
										<li key={i} className="bg-gray-800/70 rounded px-4 py-2 text-yellow-200 border border-yellow-700/40">{p}</li>
									))}
									{!contest.participants?.length && (
										<li className="text-gray-400">No participants listed.</li>
									)}
								</ul>
							</section>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContestPage;