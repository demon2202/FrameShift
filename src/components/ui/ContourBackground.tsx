import React from 'react';

export const ContourBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-multiply dark:mix-blend-overlay">
      <svg
        className="absolute w-full h-full text-neutral-300 dark:text-neutral-800"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 Q25,30 50,50 T100,50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        />
        <path
          d="M0,30 Q40,10 60,40 T100,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        />
        <path
          d="M0,70 Q30,90 70,60 T100,80"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        />
        <path
          d="M20,0 Q10,40 40,60 T60,100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        />
        <path
          d="M80,0 Q90,30 60,50 T40,100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.1"
        />
      </svg>
    </div>
  );
};
