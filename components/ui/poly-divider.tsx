"use client";

import React from "react";

interface PolyDividerProps {
  fill: string; // The color of the NEXT section
  position?: "bottom" | "top";
  className?: string;
}

export function PolyDivider({ fill, position = "bottom", className = "" }: PolyDividerProps) {
  return (
    <div 
      className={`absolute left-0 right-0 w-full overflow-hidden leading-[0] z-20 ${
        position === "bottom" ? "bottom-0" : "top-0 rotate-180"
      } ${className}`}
    >
      <svg 
        className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]" 
        data-name="Layer 1" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        {/* The Careem-style "Jagged Hill" shape */}
        <path 
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          opacity=".25" 
          fill={fill} // Opacity layer for depth
        />
        <path 
          d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43c54.52-5.23,109.8,21.6,156.67,61.11V0Z" 
          fill={fill} // Main jagged block
        />
      </svg>
    </div>
  );
}
