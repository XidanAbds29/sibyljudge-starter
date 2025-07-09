import React from 'react';

const CyberGrid = () => (
  <svg
    className="pointer-events-none fixed top-0 left-0 h-full w-full"
    style={{ zIndex: -1 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="pattern-b933c70d-47b2-4063-a348-74c141f1b90d"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
        patternTransform="translate(-0.5, -0.5)"
      >
        <path
          d="M10 0V20M0 10H20"
          strokeWidth="0.5"
          className="stroke-cyan-900/80"
        ></path>
      </pattern>
      <pattern
        id="pattern-52c7963e-6356-4957-8975-313a4247a625"
        x="0"
y="0"
        width="80"
        height="80"
        patternUnits="userSpaceOnUse"
        patternTransform="translate(-0.5, -0.5)"
      >
        <path
          d="M80 0V80M0 80H80"
          strokeWidth="1"
          className="stroke-cyan-800/90"
        ></path>
      </pattern>
      <radialGradient id="grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(10, 10, 25, 0.1)" />
        <stop offset="100%" stopColor="rgba(10, 10, 25, 0)" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"></rect>
    <rect
      width="100%"
      height="100%"
      fill="url(#pattern-b933c70d-47b2-4063-a348-74c141f1b90d)"
    ></rect>
    <rect
      width="100%"
      height="100%"
      fill="url(#pattern-52c7963e-6356-4957-8975-313a4247a625)"
    ></rect>
  </svg>
);

export default CyberGrid;
