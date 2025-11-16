import React from "react";

interface GiftBoxProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isDark?: boolean;
}

// GiftBox 1: Diagonal Stripes Pattern
export function GiftBox1({ className = "", primaryColor = "#ef4444", secondaryColor = "#dc2626", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Diagonal stripe pattern */}
        <pattern id="stripes1" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <rect width="4" height="8" fill={primaryColor} />
          <rect x="4" width="4" height="8" fill={secondaryColor} />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#stripes1)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Vertical ribbon */}
      <rect x="47" y="25" width="6" height="55" fill={secondaryColor} opacity="0.9" />
      
      {/* Horizontal ribbon on lid */}
      <rect x="15" y="29" width="70" height="4" fill={secondaryColor} opacity="0.8" />
      
      {/* Bow */}
      <ellipse cx="40" cy="25" rx="8" ry="5" fill={primaryColor} />
      <ellipse cx="60" cy="25" rx="8" ry="5" fill={primaryColor} />
      <circle cx="50" cy="25" r="4" fill={secondaryColor} />
      
      {/* Bow tails */}
      <path d="M 45 28 Q 42 32 40 35" stroke={primaryColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 55 28 Q 58 32 60 35" stroke={primaryColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// GiftBox 2: Polka Dots Pattern
export function GiftBox2({ className = "", primaryColor = "#22c55e", secondaryColor = "#16a34a", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Polka dot pattern */}
        <pattern id="dots2" patternUnits="userSpaceOnUse" width="12" height="12">
          <rect width="12" height="12" fill={primaryColor} />
          <circle cx="6" cy="6" r="2.5" fill={secondaryColor} />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#dots2)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Decorative dots on lid */}
      <circle cx="30" cy="31" r="2" fill={secondaryColor} opacity="0.6" />
      <circle cx="45" cy="31" r="2" fill={secondaryColor} opacity="0.6" />
      <circle cx="55" cy="31" r="2" fill={secondaryColor} opacity="0.6" />
      <circle cx="70" cy="31" r="2" fill={secondaryColor} opacity="0.6" />
      
      {/* Ribbon cross */}
      <rect x="47" y="25" width="6" height="55" fill={boxColor} opacity="0.95" stroke={secondaryColor} strokeWidth="1" />
      <rect x="15" y="47" width="70" height="6" fill={boxColor} opacity="0.95" stroke={secondaryColor} strokeWidth="1" />
      
      {/* Bow */}
      <ellipse cx="38" cy="25" rx="9" ry="6" fill={secondaryColor} />
      <ellipse cx="62" cy="25" rx="9" ry="6" fill={secondaryColor} />
      <circle cx="50" cy="25" r="5" fill={primaryColor} />
      <circle cx="50" cy="25" r="2.5" fill={boxColor} />
    </svg>
  );
}

// GiftBox 3: Zigzag/Chevron Pattern
export function GiftBox3({ className = "", primaryColor = "#3b82f6", secondaryColor = "#2563eb", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Zigzag chevron pattern */}
        <pattern id="chevron3" patternUnits="userSpaceOnUse" width="20" height="10">
          <rect width="20" height="10" fill={primaryColor} />
          <path d="M 0 5 L 5 0 L 10 5 L 5 10 Z" fill={secondaryColor} />
          <path d="M 10 5 L 15 0 L 20 5 L 15 10 Z" fill={secondaryColor} />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#chevron3)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid with gradient */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      <rect x="15" y="25" width="70" height="4" fill={secondaryColor} opacity="0.5" rx="2" />
      
      {/* Wide ribbon */}
      <rect x="45" y="25" width="10" height="55" fill={secondaryColor} opacity="0.85" />
      <rect x="46" y="25" width="2" height="55" fill={boxColor} opacity="0.3" />
      <rect x="52" y="25" width="2" height="55" fill={boxColor} opacity="0.3" />
      
      {/* Decorative bow */}
      <path d="M 35 25 Q 30 20 35 15 Q 40 20 35 25" fill={secondaryColor} />
      <path d="M 65 25 Q 70 20 65 15 Q 60 20 65 25" fill={secondaryColor} />
      <ellipse cx="50" cy="20" rx="6" ry="8" fill={primaryColor} />
      <ellipse cx="50" cy="20" rx="3" ry="4" fill={boxColor} opacity="0.4" />
    </svg>
  );
}

// GiftBox 4: Stars Pattern
export function GiftBox4({ className = "", primaryColor = "#a855f7", secondaryColor = "#9333ea", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Star pattern */}
        <pattern id="stars4" patternUnits="userSpaceOnUse" width="15" height="15">
          <rect width="15" height="15" fill={primaryColor} />
          <path 
            d="M 7.5 3 L 8.5 6 L 11.5 6 L 9 8 L 10 11 L 7.5 9 L 5 11 L 6 8 L 3.5 6 L 6.5 6 Z" 
            fill={secondaryColor} 
          />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#stars4)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid with shimmer */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Shimmer effect on lid */}
      <ellipse cx="50" cy="31" rx="25" ry="3" fill={boxColor} opacity="0.2" />
      
      {/* Crossed ribbons */}
      <rect x="47" y="25" width="6" height="55" fill={boxColor} opacity="0.9" stroke={secondaryColor} strokeWidth="1.5" />
      <rect x="15" y="47" width="70" height="6" fill={boxColor} opacity="0.9" stroke={secondaryColor} strokeWidth="1.5" />
      
      {/* Star decorations at intersection */}
      <path d="M 50 50 L 51 47 L 54 47 L 52 45 L 53 42 L 50 44 L 47 42 L 48 45 L 46 47 L 49 47 Z" fill={secondaryColor} />
      
      {/* Elegant bow with star center */}
      <ellipse cx="38" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <ellipse cx="62" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <circle cx="50" cy="24" r="5" fill={primaryColor} />
      <path d="M 50 22 L 50.5 23.5 L 52 23.5 L 51 24.5 L 51.5 26 L 50 25 L 48.5 26 L 49 24.5 L 48 23.5 L 49.5 23.5 Z" fill={boxColor} />
    </svg>
  );
}

// GiftBox 5: Hearts Pattern
export function GiftBox5({ className = "", primaryColor = "#f59e0b", secondaryColor = "#d97706", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Heart pattern */}
        <pattern id="hearts5" patternUnits="userSpaceOnUse" width="16" height="16">
          <rect width="16" height="16" fill={primaryColor} />
          <path 
            d="M 8 12 C 8 12, 4 8, 4 6 C 4 4, 6 3, 7 4 C 8 5, 8 5, 8 5 C 8 5, 8 5, 9 4 C 10 3, 12 4, 12 6 C 12 8, 8 12, 8 12 Z" 
            fill={secondaryColor} 
          />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#hearts5)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Decorative trim on lid */}
      <rect x="15" y="25" width="70" height="2" fill={secondaryColor} opacity="0.6" rx="1" />
      <rect x="15" y="35" width="70" height="2" fill={secondaryColor} opacity="0.6" rx="1" />
      
      {/* Elegant ribbon */}
      <rect x="46" y="25" width="8" height="55" fill={secondaryColor} opacity="0.8" />
      <rect x="48" y="25" width="4" height="55" fill={boxColor} opacity="0.2" />
      
      {/* Heart decoration on ribbon */}
      <path d="M 50 55 C 50 55, 47 52, 47 50.5 C 47 49.5, 48.5 48.5, 49 49.5 C 50 50, 50 50, 50 50 C 50 50, 50 50, 51 49.5 C 51.5 48.5, 53 49.5, 53 50.5 C 53 52, 50 55, 50 55 Z" 
        fill={primaryColor} 
      />
      
      {/* Large decorative bow */}
      <ellipse cx="35" cy="24" rx="11" ry="8" fill={secondaryColor} />
      <ellipse cx="65" cy="24" rx="11" ry="8" fill={secondaryColor} />
      <ellipse cx="35" cy="24" rx="7" ry="5" fill={primaryColor} opacity="0.5" />
      <ellipse cx="65" cy="24" rx="7" ry="5" fill={primaryColor} opacity="0.5" />
      
      {/* Bow center with heart */}
      <circle cx="50" cy="24" r="6" fill={primaryColor} />
      <path 
        d="M 50 26 C 50 26, 47.5 23.5, 47.5 22.5 C 47.5 21.5, 48.5 21, 49 21.5 C 49.5 22, 50 22, 50 22 C 50 22, 50.5 22, 51 21.5 C 51.5 21, 52.5 21.5, 52.5 22.5 C 52.5 23.5, 50 26, 50 26 Z" 
        fill={boxColor}
      />
      
      {/* Bow streamers */}
      <path d="M 44 27 Q 40 32 38 37" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 56 27 Q 60 32 62 37" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// GiftBox 6: Wavy Lines Pattern (Pink)
export function GiftBox6({ className = "", primaryColor = "#ec4899", secondaryColor = "#db2777", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Wavy lines pattern */}
        <pattern id="waves6" patternUnits="userSpaceOnUse" width="20" height="8">
          <rect width="20" height="8" fill={primaryColor} />
          <path d="M 0 4 Q 5 2 10 4 T 20 4" stroke={secondaryColor} strokeWidth="2" fill="none" />
          <path d="M 0 6 Q 5 4 10 6 T 20 6" stroke={secondaryColor} strokeWidth="1.5" fill="none" opacity="0.6" />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#waves6)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Decorative wave on lid */}
      <path d="M 20 31 Q 35 28 50 31 T 80 31" stroke={secondaryColor} strokeWidth="2" fill="none" opacity="0.7" />
      
      {/* Vertical ribbon */}
      <rect x="47" y="25" width="6" height="55" fill={boxColor} opacity="0.9" stroke={secondaryColor} strokeWidth="1.5" />
      
      {/* Bow with wavy design */}
      <ellipse cx="37" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <ellipse cx="63" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <circle cx="50" cy="24" r="6" fill={primaryColor} />
      
      {/* Wavy decoration in bow center */}
      <path d="M 46 24 Q 48 22 50 24 T 54 24" stroke={boxColor} strokeWidth="1.5" fill="none" />
      
      {/* Bow ribbons */}
      <path d="M 42 28 Q 38 33 36 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 58 28 Q 62 33 64 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// GiftBox 7: Grid/Crosshatch Pattern (Cyan)
export function GiftBox7({ className = "", primaryColor = "#06b6d4", secondaryColor = "#0891b2", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Grid crosshatch pattern */}
        <pattern id="grid7" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={primaryColor} />
          <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke={secondaryColor} strokeWidth="1.5" />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#grid7)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Grid decoration on lid */}
      <rect x="20" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      <rect x="30" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      <rect x="40" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      <rect x="55" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      <rect x="65" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      <rect x="75" y="28" width="5" height="5" fill={secondaryColor} opacity="0.5" />
      
      {/* Double ribbon */}
      <rect x="46" y="25" width="8" height="55" fill={boxColor} opacity="0.9" stroke={secondaryColor} strokeWidth="1.5" />
      <rect x="49" y="25" width="2" height="55" fill={secondaryColor} opacity="0.5" />
      
      {/* Geometric bow */}
      <polygon points="35,24 40,20 40,28" fill={secondaryColor} />
      <polygon points="65,24 60,20 60,28" fill={secondaryColor} />
      <rect x="45" y="19" width="10" height="10" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <rect x="48" y="22" width="4" height="4" fill={boxColor} opacity="0.4" />
    </svg>
  );
}

// GiftBox 8: Snowflakes Pattern (Orange)
export function GiftBox8({ className = "", primaryColor = "#f97316", secondaryColor = "#ea580c", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Snowflake pattern */}
        <pattern id="snowflakes8" patternUnits="userSpaceOnUse" width="16" height="16">
          <rect width="16" height="16" fill={primaryColor} />
          <g transform="translate(8, 8)">
            <line x1="0" y1="-5" x2="0" y2="5" stroke={secondaryColor} strokeWidth="1" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke={secondaryColor} strokeWidth="1" />
            <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke={secondaryColor} strokeWidth="1" />
            <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke={secondaryColor} strokeWidth="1" />
          </g>
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#snowflakes8)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Snowflake decorations on lid */}
      <g transform="translate(30, 31)">
        <line x1="0" y1="-3" x2="0" y2="3" stroke={secondaryColor} strokeWidth="1.5" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke={secondaryColor} strokeWidth="1.5" />
      </g>
      <g transform="translate(70, 31)">
        <line x1="0" y1="-3" x2="0" y2="3" stroke={secondaryColor} strokeWidth="1.5" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke={secondaryColor} strokeWidth="1.5" />
      </g>
      
      {/* Ribbon */}
      <rect x="47" y="25" width="6" height="55" fill={secondaryColor} opacity="0.85" />
      <rect x="15" y="47" width="70" height="6" fill={secondaryColor} opacity="0.85" />
      
      {/* Snowflake at intersection */}
      <g transform="translate(50, 50)">
        <line x1="0" y1="-4" x2="0" y2="4" stroke={boxColor} strokeWidth="1.5" />
        <line x1="-4" y1="0" x2="4" y2="0" stroke={boxColor} strokeWidth="1.5" />
        <line x1="-3" y1="-3" x2="3" y2="3" stroke={boxColor} strokeWidth="1.5" />
        <line x1="3" y1="-3" x2="-3" y2="3" stroke={boxColor} strokeWidth="1.5" />
      </g>
      
      {/* Bow */}
      <ellipse cx="39" cy="23" rx="9" ry="7" fill={secondaryColor} />
      <ellipse cx="61" cy="23" rx="9" ry="7" fill={secondaryColor} />
      <circle cx="50" cy="23" r="5" fill={primaryColor} />
      
      {/* Small snowflake in bow */}
      <g transform="translate(50, 23)">
        <line x1="0" y1="-2" x2="0" y2="2" stroke={boxColor} strokeWidth="1" />
        <line x1="-2" y1="0" x2="2" y2="0" stroke={boxColor} strokeWidth="1" />
      </g>
    </svg>
  );
}

// GiftBox 9: Diamond Pattern (Teal)
export function GiftBox9({ className = "", primaryColor = "#14b8a6", secondaryColor = "#0d9488", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Diamond pattern */}
        <pattern id="diamonds9" patternUnits="userSpaceOnUse" width="12" height="12">
          <rect width="12" height="12" fill={primaryColor} />
          <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" fill={secondaryColor} />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#diamonds9)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Diamond decorations on lid */}
      <path d="M 35 31 L 37 29 L 39 31 L 37 33 Z" fill={secondaryColor} opacity="0.7" />
      <path d="M 48 31 L 50 29 L 52 31 L 50 33 Z" fill={secondaryColor} opacity="0.7" />
      <path d="M 61 31 L 63 29 L 65 31 L 63 33 Z" fill={secondaryColor} opacity="0.7" />
      
      {/* Ribbon */}
      <rect x="47" y="25" width="6" height="55" fill={boxColor} opacity="0.95" stroke={secondaryColor} strokeWidth="1.5" />
      
      {/* Diamond on ribbon */}
      <path d="M 50 55 L 53 52 L 50 49 L 47 52 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1" />
      
      {/* Bow */}
      <polygon points="30,24 38,20 38,28" fill={secondaryColor} />
      <polygon points="70,24 62,20 62,28" fill={secondaryColor} />
      <path d="M 50 18 L 54 24 L 50 30 L 46 24 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 50 21 L 52 24 L 50 27 L 48 24 Z" fill={boxColor} opacity="0.3" />
      
      {/* Bow ribbons */}
      <path d="M 43 28 Q 40 33 38 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 57 28 Q 60 33 62 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// GiftBox 10: Circles Pattern (Rose)
export function GiftBox10({ className = "", primaryColor = "#f43f5e", secondaryColor = "#e11d48", isDark = false }: GiftBoxProps) {
  const boxColor = isDark ? "#334155" : "#ffffff";
  const strokeColor = isDark ? "#475569" : "#e2e8f0";
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Concentric circles pattern */}
        <pattern id="circles10" patternUnits="userSpaceOnUse" width="14" height="14">
          <rect width="14" height="14" fill={primaryColor} />
          <circle cx="7" cy="7" r="5" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.5" fill={secondaryColor} />
        </pattern>
      </defs>
      
      {/* Gift box body */}
      <rect x="20" y="35" width="60" height="45" fill="url(#circles10)" stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Box lid */}
      <rect x="15" y="25" width="70" height="12" fill={primaryColor} stroke={strokeColor} strokeWidth="1.5" rx="2" />
      
      {/* Circle decorations on lid */}
      <circle cx="25" cy="31" r="2.5" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="40" cy="31" r="2.5" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="60" cy="31" r="2.5" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="75" cy="31" r="2.5" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
      
      {/* Ribbon cross */}
      <rect x="47" y="25" width="6" height="55" fill={boxColor} opacity="0.95" stroke={secondaryColor} strokeWidth="1.5" />
      <rect x="15" y="47" width="70" height="6" fill={boxColor} opacity="0.95" stroke={secondaryColor} strokeWidth="1.5" />
      
      {/* Circle at intersection */}
      <circle cx="50" cy="50" r="4" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="2" fill={boxColor} opacity="0.6" />
      
      {/* Bow with circular design */}
      <ellipse cx="37" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <ellipse cx="63" cy="24" rx="10" ry="7" fill={secondaryColor} />
      <circle cx="37" cy="24" r="5" fill={primaryColor} opacity="0.6" />
      <circle cx="63" cy="24" r="5" fill={primaryColor} opacity="0.6" />
      <circle cx="50" cy="24" r="6" fill={primaryColor} />
      <circle cx="50" cy="24" r="3" fill={boxColor} opacity="0.4" />
      
      {/* Bow ribbons */}
      <path d="M 42 28 Q 38 33 36 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 58 28 Q 62 33 64 38" stroke={secondaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

