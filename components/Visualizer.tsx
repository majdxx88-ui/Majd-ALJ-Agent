import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  color: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, color }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2.5 rounded-full transition-all duration-300 ${color}`}
          style={{
            height: isActive ? `${Math.random() * 40 + 15}px` : '8px',
            animation: isActive ? `bounce 1s infinite ${i * 0.15}s` : 'none',
            opacity: isActive ? 1 : 0.5
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.2); }
        }
      `}</style>
    </div>
  );
};