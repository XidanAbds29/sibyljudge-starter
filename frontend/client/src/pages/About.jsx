import React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] p-8 max-w-4xl mx-auto">
      <h1
        className="text-5xl font-extrabold text-cyan-400 mb-8 text-center"
        style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.6)' }}
      >
        About SibylJudge
      </h1>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Our Mission</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          {/* Add your mission statement here */}
          SibylJudge is dedicated to empowering coders by providing a comprehensive platform for competitive programming and algorithmic problem-solving.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">What We Offer</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          {/* Describe your features or offerings */}
          We offer a vast archive of problems, real-time judging with detailed feedback, and competitive contests to challenge and grow your coding skills.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Our Team</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          {/* Introduce your team or contributors */}
          Created and maintained by a passionate team of developers and competitive programmers committed to building the best coding experience.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Contact Us</h2>
        <p className="text-gray-300 leading-relaxed text-lg mb-4">
          {/* Provide contact info or ways to connect */}
          For inquiries, feedback, or support, please reach out to us at: 
          <br />
          <a href="mailto:contact@sibyljudge.com" className="text-cyan-400 hover:underline">
            contact@sibyljudge.com
          </a>
        </p>
      </section>
    </div>
  );
}
