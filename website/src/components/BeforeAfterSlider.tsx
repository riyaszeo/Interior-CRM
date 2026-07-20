import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage, height = 'h-[400px] md:h-[450px]' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateWidth = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  };

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseDown = () => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = () => {
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };

  return (
    <div 
      ref={containerRef} 
      className={`ba-slider-container relative select-none w-full overflow-hidden rounded-2xl ${height}`}
      onTouchStart={handleTouchStart}
    >
      {/* After Image */}
      <img 
        src={afterImage} 
        alt="After Design Transformation" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-bold uppercase tracking-wider z-10">After</div>

      {/* Before Image */}
      <div 
        className="absolute inset-y-0 left-0 overflow-hidden" 
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Before Design Transformation" 
          className="absolute inset-0 object-cover h-full" 
          style={{ width: containerWidth }}
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-bold uppercase tracking-wider z-10">Before</div>
      </div>

      {/* Slider Bar */}
      <div 
        className="absolute inset-y-0 w-1 bg-white cursor-ew-resize flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        <div className="w-10 h-10 rounded-full bg-white text-slate-800 shadow-xl border border-gray-200 flex items-center justify-center select-none cursor-ew-resize">
          <span className="text-xs font-bold">&lt;&gt;</span>
        </div>
      </div>
    </div>
  );
};
export default BeforeAfterSlider;
