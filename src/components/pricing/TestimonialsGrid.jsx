import React, { useState, useEffect, useRef } from 'react';

export default function TestimonialsGrid({ testimonials }) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!containerRef.current || testimonials.length === 0) return;

    const calculatePositions = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const gap = 24;
      
      // Determine number of columns based on screen width
      let numCols = 1;
      if (containerWidth >= 1024) numCols = 3;
      else if (containerWidth >= 768) numCols = 2;
      
      const colWidth = (containerWidth - gap * (numCols - 1)) / numCols;
      
      // Track the bottom position of each column
      const colHeights = new Array(numCols).fill(0);
      const newPositions = [];

      testimonials.forEach((_, index) => {
        const cardEl = cardRefs.current[index];
        if (!cardEl) return;

        // Find the shortest column
        const shortestCol = colHeights.indexOf(Math.min(...colHeights));
        
        // Calculate position
        const left = shortestCol * (colWidth + gap);
        const top = colHeights[shortestCol];
        
        newPositions.push({ left, top, width: colWidth });
        
        // Update column height
        colHeights[shortestCol] += cardEl.offsetHeight + gap;
      });

      setPositions(newPositions);
      setContainerHeight(Math.max(...colHeights));
    };

    // Initial calculation after render
    const timer = setTimeout(calculatePositions, 50);
    
    // Recalculate on resize
    window.addEventListener('resize', calculatePositions);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePositions);
    };
  }, [testimonials]);

  return (
    <div className="relative pb-32">
      {/* Hidden cards for measurement */}
      <div className="invisible absolute" aria-hidden="true">
        {testimonials.map((testimonial, index) => (
          <div
            key={`measure-${index}`}
            ref={el => cardRefs.current[index] = el}
            className="water-glass-effect rounded-2xl p-6 border border-white/40"
            style={{ width: 'calc((100% - 48px) / 3)', maxWidth: '400px' }}
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={testimonial.photo}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-600">{testimonial.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              {testimonial.text}
            </p>
          </div>
        ))}
      </div>

      {/* Actual positioned cards */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ height: containerHeight || 'auto' }}
      >
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="water-glass-effect rounded-2xl p-6 border border-white/40 hover:border-white/60 transition-all"
            style={{
              position: positions.length > 0 ? 'absolute' : 'relative',
              left: positions[index]?.left || 0,
              top: positions[index]?.top || 0,
              width: positions[index]?.width || '100%',
              marginBottom: positions.length === 0 ? '24px' : 0
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={testimonial.photo}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-600">{testimonial.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              {testimonial.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}