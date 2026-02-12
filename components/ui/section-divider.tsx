"use client";

interface SectionDividerProps {
  fill: string;
  className?: string;
}

export function SectionDivider({ fill, className = "" }: SectionDividerProps) {
  return (
    <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] z-20 ${className}`}>
      <svg 
        className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px]" 
        data-name="Layer 1" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none"
      >
        <path 
          d="M1200 120L0 16.48V0h1200v120z" 
          fill={fill} 
        />
      </svg>
    </div>
  );
}
