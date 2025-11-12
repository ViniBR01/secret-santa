"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";

// Custom Snowflake SVG icon for light theme
function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Center */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      
      {/* Main cross arms */}
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      
      {/* Diagonal arms */}
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      
      {/* Top branches */}
      <line x1="12" y1="2" x2="9" y2="5" />
      <line x1="12" y1="2" x2="15" y2="5" />
      
      {/* Bottom branches */}
      <line x1="12" y1="22" x2="9" y2="19" />
      <line x1="12" y1="22" x2="15" y2="19" />
      
      {/* Left branches */}
      <line x1="2" y1="12" x2="5" y2="9" />
      <line x1="2" y1="12" x2="5" y2="15" />
      
      {/* Right branches */}
      <line x1="22" y1="12" x2="19" y2="9" />
      <line x1="22" y1="12" x2="19" y2="15" />
    </svg>
  );
}

// Custom Fireplace/Flame SVG icon for dark theme
function FireplaceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Main flame */}
      <path d="M12 2c-1.5 3.5-3 5-3 8 0 2.5 1.3 4.5 3 4.5s3-2 3-4.5c0-3-1.5-4.5-3-8z" fill="currentColor" opacity="0.8" />
      
      {/* Inner flame */}
      <path d="M12 7c-0.8 2-1.5 3-1.5 4.5 0 1.5 0.7 2.5 1.5 2.5s1.5-1 1.5-2.5c0-1.5-0.7-2.5-1.5-4.5z" fill="currentColor" opacity="0.4" />
      
      {/* Fireplace base */}
      <path d="M4 15h16v7H4z" fill="none" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="4" y1="22" x2="20" y2="22" />
      <line x1="4" y1="15" x2="4" y2="22" />
      <line x1="20" y1="15" x2="20" y2="22" />
      
      {/* Logs */}
      <line x1="6" y1="19" x2="18" y2="19" strokeWidth="2.5" />
      <line x1="7" y1="17" x2="17" y2="17" strokeWidth="2" />
    </svg>
  );
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme state from HTML element
    const htmlElement = document.documentElement;
    setIsDark(htmlElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    
    if (htmlElement.classList.contains("dark")) {
      htmlElement.classList.remove("dark");
      setIsDark(false);
    } else {
      htmlElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
        isDark 
          ? "bg-blue-100 dark:bg-blue-900/70 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/80" 
          : "bg-orange-100 border-orange-300 hover:bg-orange-200"
      }`}
      title={isDark ? "Switch to Snowy Morning (Light)" : "Switch to Cozy Fireplace (Dark)"}
    >
      {/* Icons with smooth transition - showing the theme you're switching TO */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className={`absolute transition-all duration-500 ${
            isDark 
              ? "opacity-100 rotate-0 scale-100" 
              : "opacity-0 rotate-90 scale-0"
          }`}
        >
          <SnowflakeIcon className="h-[1.2rem] w-[1.2rem] text-blue-600 dark:text-blue-300" />
        </div>
        
        <div
          className={`absolute transition-all duration-500 ${
            isDark 
              ? "opacity-0 -rotate-90 scale-0" 
              : "opacity-100 rotate-0 scale-100"
          }`}
        >
          <FireplaceIcon className="h-[1.2rem] w-[1.2rem] text-orange-600" />
        </div>
      </div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

