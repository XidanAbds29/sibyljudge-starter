import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

export default function FAQ() {
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

  const faqSections = [
    {
      title: "About SibylJudge",
      items: [
        {
          q: "What is SibylJudge?",
          a: "SibylJudge is an online platform for competitive programming, supporting virtual contests, problem archives, and real-time judging across multiple online judges."
        },
        {
          q: "How is SibylJudge different from other judges?",
          a: "SibylJudge aggregates problems from various online judges, lets you participate in virtual contests, and provides a unified interface for problem solving and submissions."
        }
      ]
    },
    {
      title: "User Accounts",
      items: [
        {
          q: "I forgot my password. What should I do?",
          a: "Use the password reset link on the login page. Enter your username or email, and follow the instructions sent to your email."
        },
        {
          q: "I forgot my password and didn't provide a correct email during registration.",
          a: "Contact our support team at sibyljudge@gmail.com and provide evidence that you own the account."
        },
        {
          q: "Can I change my username?",
          a: "Currently, username changes are not supported. You may register a new account if needed."
        },
        {
          q: "How can I delete my account?",
          a: "Contact us from the email associated with your account and request deletion."
        },
        {
          q: "How do I stop notification emails?",
          a: "You can manage your notification preferences from your account settings after signing in."
        }
      ]
    },
    {
      title: "Contests & Problems",
      items: [
        {
          q: "How do I participate in contests?",
          a: "Register for upcoming contests from the 'Contests' page. Make sure you are signed in and listed as a participant before the contest starts."
        },
        {
          q: "Can I create my own contest or mashup?",
          a: "Yes, you can create custom mashup contests using problems from the archive or supported online judges."
        },
        {
          q: "The problems I solved in a contest don't show up in my profile.",
          a: "Solved problems will be reflected in your profile after the contest ends and the system processes the results."
        }
      ]
    },
    {
      title: "Technical Issues",
      items: [
        {
          q: "What does 'Submit Failed' mean?",
          a: (
            <>
              It means your code was not submitted to the remote judge successfully. Possible reasons include:<br />
              <ul className="list-disc ml-6">
                <li>The remote judge is temporarily unavailable.</li>
                <li>Network issues between SibylJudge and the remote judge.</li>
                <li>The remote judge has changed and SibylJudge hasn't adapted yet.</li>
                <li>Unknown system anomalies.</li>
              </ul>
              You can retry submission or contact support if the issue persists.
            </>
          )
        },
        {
          q: "Why do I get Compile Error (CE) when submitting Java code?",
          a: (
            <>
              Make sure your main class is named <code>Main</code> and the file is <code>Main.java</code>.<br />
              <b>Incorrect:</b>
              <pre className="bg-gray-800 p-2 rounded text-sm mt-1 mb-1">
{`public class main {
    public static void main(String[] args) {
        // your code
    }
}`}
              </pre>
              <b>Correct:</b>
              <pre className="bg-gray-800 p-2 rounded text-sm mt-1 mb-1">
{`public class Main {
    public static void main(String[] args) {
        // your code
    }
}`}
              </pre>
            </>
          )
        },
        {
          q: "Why do I get Runtime Error (RE)?",
          a: (
            <>
              Common causes include:<br />
              <ul className="list-disc ml-6">
                <li>Not returning 0 from <code>int main()</code> in C/C++.</li>
                <li>Division by zero.</li>
                <li>Array out-of-bounds access.</li>
                <li>Incorrect input/output handling.</li>
              </ul>
              Check the problem statement and your code carefully.
            </>
          )
        },
        {
          q: "What programming languages are supported?",
          a: "Supported languages depend on the remote judge. See the contest or problem page for the list of available languages."
        },
        {
          q: "My submission is stuck in 'Waiting for Judge' (WJ) status.",
          a: "This may be due to high server load or remote judge issues. If it persists beyond normal processing time, contact support."
        }
      ]
    },
    {
      title: "General",
      items: [
        {
          q: "Where can I find more information about ratings and divisions?",
          a: "See the 'Rules' or 'Help' section for details on rating calculation and divisions used by the system."
        },
        {
          q: "How can I contact support or report a bug?",
          a: (
            <>
              Email us at <a href="mailto:sibyljudge@gmail.com" className="text-cyan-400 hover:underline">sibyljudge@gmail.com</a> or use the feedback form on the website.
            </>
          )
        },
        {
          q: "What is your copyright policy?",
          a: "See the User Policy and Intellectual Property section for details on content usage and system guidelines."
        }
      ]
    }
  ];

  // Generate ids for each question
  faqSections.forEach((section) => {
    section.items.forEach((item, idx) => {
      item.id = `${section.title.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}`;
    });
  });

  return (
    <div ref={heroRef} className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
      {/* Background only for FAQ content area */}
      <div className="relative z-10 p-8 max-w-4xl mx-auto w-full flex-1">
        {/* Section background */}
        <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 w-full h-full"></div>
          <div className="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.12)_0,transparent_70%)] animate-pulse"></div>
          <div className="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_70%_80%,rgba(0,255,255,0.08)_0,transparent_70%)]"></div>
        </div>

        <h1
          className="text-4xl font-light text-cyan-300 mb-8 text-center tracking-widest"
          style={{
            textShadow: '0 0 12px #00fff7, 0 0 2px #00fff7',
            fontFamily: "'Share Tech Mono', 'Orbitron', 'monospace', sans-serif",
            letterSpacing: '0.2em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Frequently Asked Questions
        </h1>

        <p className="text-center text-gray-300 mb-8 italic">
          <span className="text-cyan-400">"All questions will be judged by the system."</span> Find answers to common queries below.
        </p>

        {/* Fancy Section Navigation - glassmorphism cards with gradient accent bar */}
        <nav className="mb-10 grid gap-10">
          {faqSections.map((section) => (
            <div
              key={section.title}
              className="backdrop-blur-md bg-gray-900/70 rounded-2xl shadow-xl p-6 relative overflow-hidden border border-gray-800"
            >
              {/* Gradient accent bar */}
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 via-cyan-600 to-transparent rounded-l-2xl"></div>
              <h2
                className="text-xl font-semibold mb-4 flex items-center gap-2 tracking-widest"
                style={{
                  color: "#00fff7",
                  textShadow: "0 0 8px #00fff7, 0 0 1px #00fff7",
                  fontFamily: "'Orbitron', 'Share Tech Mono', 'monospace', sans-serif"
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-2"></span>
                {section.title}
              </h2>
              <ul className="list-none ml-0 flex flex-col gap-0">
                {section.items.map((item) => (
                  <li key={item.id} className="mb-1">
                    <a
                      href={`#${item.id}`}
                      className="block pl-4 py-2 border-l-2 border-cyan-400/60 hover:bg-cyan-900/20 transition-all duration-200 text-cyan-200 hover:text-cyan-100 font-medium tracking-wide"
                      style={{
                        fontFamily: "'Share Tech Mono', 'Orbitron', 'monospace', sans-serif",
                        textShadow: "0 0 4px #00fff7, 0 0 1px #00fff7"
                      }}
                    >
                      {item.q}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Answers */}
        <div className="space-y-14 pb-0">
          {faqSections.map((section) => (
            <div key={section.title}>
              <h2
                className="text-2xl font-semibold mb-6 border-b border-cyan-700 pb-2 tracking-widest"
                style={{
                  color: "#00fff7",
                  textShadow: "0 0 8px #00fff7, 0 0 1px #00fff7",
                  fontFamily: "'Orbitron', 'Share Tech Mono', 'monospace', sans-serif"
                }}
              >
                {section.title}
              </h2>
              <div className="space-y-8">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-800 scroll-mt-24 relative"
                    style={{
                      boxShadow: "0 0 12px 2px #00fff730, 0 0 2px #00fff730",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold text-cyan-200 mb-2 tracking-wide"
                      style={{
                        fontFamily: "'Orbitron', 'Share Tech Mono', 'monospace', sans-serif",
                        textShadow: "0 0 6px #00fff7, 0 0 1px #00fff7"
                      }}
                    >
                      {item.q}
                    </h3>
                    <div className="text-gray-300 leading-relaxed text-base">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation/footer tab */}
      {/* Removed local footer to avoid duplicate with App.jsx */}
    </div>
  );
}