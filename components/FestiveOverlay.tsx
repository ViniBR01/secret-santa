"use client";

import { useEffect, useState } from "react";

export function FestiveOverlay() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Light theme - Snowfall particles
  const snowflakes = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 3, // 3-7px
    duration: Math.random() * 8 + 10, // 10-18s
    delay: Math.random() * 5, // 0-5s delay
  }));

  const frostSparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 5 + 3, // 3-8px
    delay: Math.random() * 3,
  }));

  // Dark theme - Ember particles
  const embers = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2, // 2-6px
    duration: Math.random() * 6 + 8, // 8-14s
    delay: Math.random() * 4,
  }));

  const emberSparks = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 30 + 60}%`, // Bottom 40% of screen
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 2, // 2-5px
    delay: Math.random() * 2,
  }));

  const warmGlows = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 40 + 30, // 30-70px
    delay: Math.random() * 4,
  }));

  return (
    <div className="festive-overlay">
      {!isDark ? (
        // Light theme - Snowy Morning
        <>
          {/* Falling snowflakes */}
          {snowflakes.map((flake) => (
            <div
              key={`snowflake-${flake.id}`}
              className="snowflake"
              style={{
                left: flake.left,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`,
              }}
            />
          ))}

          {/* Frost sparkles */}
          {frostSparkles.map((sparkle) => (
            <div
              key={`frost-${sparkle.id}`}
              className="frost-sparkle"
              style={{
                top: sparkle.top,
                left: sparkle.left,
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                animationDelay: `${sparkle.delay}s`,
              }}
            />
          ))}
        </>
      ) : (
        // Dark theme - Cozy Fireplace
        <>
          {/* Rising embers */}
          {embers.map((ember) => (
            <div
              key={`ember-${ember.id}`}
              className="ember"
              style={{
                left: ember.left,
                bottom: "0",
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                animationDuration: `${ember.duration}s`,
                animationDelay: `${ember.delay}s`,
              }}
            />
          ))}

          {/* Ember sparks */}
          {emberSparks.map((spark) => (
            <div
              key={`spark-${spark.id}`}
              className="ember-spark"
              style={{
                top: spark.top,
                left: spark.left,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay}s`,
              }}
            />
          ))}

          {/* Warm glows */}
          {warmGlows.map((glow) => (
            <div
              key={`glow-${glow.id}`}
              className="warm-glow"
              style={{
                top: glow.top,
                left: glow.left,
                width: `${glow.size}px`,
                height: `${glow.size}px`,
                animationDelay: `${glow.delay}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

