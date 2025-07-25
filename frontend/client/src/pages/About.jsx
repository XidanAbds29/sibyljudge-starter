import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import abdullahPhoto from "../assets/team/abdullah.jpg";
import fuadPhoto from "../assets/team/fuad.jpg";

export default function About() {
  const heroRef = useRef();

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
        }
      );
    }
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] p-8 max-w-4xl mx-auto">
      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
      <h1
        className="text-5xl font-extrabold text-cyan-400 mb-8 text-center"
        style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.6)' }}
      >
        About SibylJudge
      </h1>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Our Mission</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          Just like the Sibyl System maintains order in society, <span className="text-cyan-400 font-semibold">SibylJudge</span> brings order to the chaos of competitive programming. 
          We're here to judge your code, not your soul - though we can't promise your Crime Coefficient won't spike when you encounter our hardest problems! 
          <br /><br />
          <span className="text-pink-400 italic">"The capacity to judge others is a power that corrupts... but judging code? That's just good practice!"</span>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">What We Offer</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          Our platform doesn't just scan your Psycho-Pass - it scans your <span className="text-cyan-400 font-semibold">programming potential</span>! 
          We offer a vast archive of problems that would make even Kogami sweat, real-time judging faster than a Dominator's trigger, 
          and competitive contests that separate the Enforcers from the Inspectors.
          <br /><br />
          <span className="text-pink-400 italic">Warning: Extended use may result in increased debugging skills and occasional eureka moments. Side effects include addiction to solving algorithms.</span>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Our Team</h2>
        <p className="text-gray-300 leading-relaxed text-lg mb-6">
          Meet the brilliant minds behind SibylJudge - our very own <span className="text-cyan-400 font-semibold">Bureau operatives</span> who've dedicated their lives to creating the ultimate coding experience. 
          Unlike the Sibyl System, we're 100% human... <span className="text-pink-400 italic">probably</span>.
        </p>
        
        <div className="bg-gray-900/30 p-6 rounded-xl border border-cyan-800/40 mb-8">
          <p className="text-gray-300 leading-relaxed text-lg text-center">
            Both team members are currently pursuing undergraduate studies in <span className="text-cyan-400 font-semibold">Computer Science and Engineering (CSE)</span> at 
            <span className="text-cyan-400 font-semibold"> Bangladesh University of Engineering and Technology (BUET)</span>. 
            SibylJudge was developed as part of their <span className="text-pink-400 font-semibold">Database Sessional course in Level-2/Term-1</span>, 
            showcasing their collaborative skills and technical innovation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-screen-2xl mx-auto px-4">
          {/* Project Lead */}
          <div className="bg-gray-900/50 p-10 rounded-xl border border-cyan-800/60 hover:border-cyan-400 hover:bg-gray-800/70 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,245,255,0.5),inset_0_0_20px_rgba(0,245,255,0.1)] hover:scale-105 hover:-translate-y-3 transform animate-fade-in-up opacity-0 animation-delay-300 cursor-pointer group">
            <div className="flex flex-col items-center mb-8">
              <img 
                src={abdullahPhoto} 
                alt="Abdullah Siham Rahman" 
                className="w-36 h-36 rounded-full border-3 border-cyan-400 mb-4 object-cover group-hover:border-cyan-300 group-hover:scale-110 transition-all duration-400 shadow-lg group-hover:shadow-[0_0_25px_rgba(0,245,255,0.7)]"
              />
              <h3 className="text-3xl font-bold text-cyan-400 text-center group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-300">Abdullah Siham Rahman</h3>
            </div>
            <p className="text-pink-400 font-semibold mb-6 text-center group-hover:text-pink-300 group-hover:scale-105 transition-all duration-300 text-xl">Chief Inspector & System Architect</p>
            
            <div className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300 space-y-4 text-lg">
              <p>
                The visionary Chief Inspector behind SibylJudge, Abdullah leads the bureau with the precision of Akane Tsunemori and the technical prowess of Shogo Makishima. 
                His <span className="text-cyan-400">Crime Coefficient</span> for creating flawless code architecture? <span className="text-green-400 font-bold">Under 100</span> - a true programming prodigy!
              </p>
              
              <p>
                Abdullah co-created the game <span className="text-cyan-400 font-semibold">TIMMIT</span>, along with some other teammates in an impressively short timeframe, demonstrating rapid development skills and innovative problem-solving abilities that bring a unique gaming perspective to SibylJudge.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center mt-6">
              <a 
                href="https://www.linkedin.com/in/abdullah-siham-rahman-142628202/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 hover:scale-110 transition-all duration-300 group-hover:translate-x-2"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a 
                href="https://github.com/XidanAbds29" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-pink-400 hover:text-pink-300 hover:scale-110 transition-all duration-300 group-hover:translate-x-2"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>

          {/* Co-Developer */}
          <div className="bg-gray-900/50 p-10 rounded-xl border border-cyan-800/60 hover:border-cyan-400 hover:bg-gray-800/70 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,245,255,0.5),inset_0_0_20px_rgba(0,245,255,0.1)] hover:scale-105 hover:-translate-y-3 transform animate-fade-in-up opacity-0 animation-delay-600 cursor-pointer group">
            <div className="flex flex-col items-center mb-8">
              <img 
                src={fuadPhoto} 
                alt="Md. Fuad Al Alam" 
                className="w-36 h-36 rounded-full border-3 border-cyan-400 mb-4 object-cover group-hover:border-cyan-300 group-hover:scale-110 transition-all duration-400 shadow-lg group-hover:shadow-[0_0_25px_rgba(0,245,255,0.7)]"
              />
              <h3 className="text-3xl font-bold text-cyan-400 text-center group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-300">Md. Fuad Al Alam</h3>
            </div>
            <p className="text-pink-400 font-semibold mb-6 text-center group-hover:text-pink-300 group-hover:scale-105 transition-all duration-300 text-xl">Senior Enforcer & Interface Specialist</p>
            
            <div className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300 space-y-4 text-lg">
              <p>
                The talented Enforcer who operates in both the digital and visual realms with the skill of Shinya Kogami. 
                Fuad's <span className="text-cyan-400">Psycho-Pass</span> readings show exceptional stability when crafting beautiful interfaces and robust backend systems. 
                His debugging skills are so sharp, they could probably paralyze a latent criminal!
              </p>
              
              <p>
                His remarkable academic achievements include participating in the <span className="text-cyan-400 font-semibold">International Mathematical Olympiad (IMO)</span> in 2021 and 2022, demonstrating exceptional mathematical prowess that enhances his algorithmic thinking and problem-solving abilities.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center mt-6">
              <a 
                href="https://www.linkedin.com/in/fuadalalam/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 hover:scale-110 transition-all duration-300 group-hover:translate-x-2"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a 
                href="https://github.com/FuadAlAlam" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-pink-400 hover:text-pink-300 hover:scale-110 transition-all duration-300 group-hover:translate-x-2"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">Contact the Bureau</h2>
        <p className="text-gray-300 leading-relaxed text-lg mb-4">
          Need to report a bug? Found a problem that even the Sibyl System can't solve? Or perhaps you want to join our ranks as a fellow Inspector? 
          <br /><br />
          Reach out to our <span className="text-cyan-400 font-semibold">Digital Surveillance Division</span> at: 
          <br />
          <a href="mailto:sibyljudge@gmail.com" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors duration-300 font-semibold">
            sibyljudge@gmail.com
          </a>
          <br /><br />
          <span className="text-pink-400 italic text-sm">
            "Remember: In the world of competitive programming, everyone's Crime Coefficient is temporary - but great code is eternal."
          </span>
        </p>
      </section>
    </div>
  );
}
