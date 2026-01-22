import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu as MenuIcon } from 'lucide-react';

export default function LiquidGlassNav({ navItems }) {
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const containerRef = useRef(null);

  // Rileva cambio di pagina
  useEffect(() => {
    const currentIndex = navItems.findIndex(
      item => location.pathname === createPageUrl(item.path)
    );
    if (currentIndex !== -1) {
      setSelectedIndex(currentIndex);
    }
  }, [location.pathname, navItems]);

  // Rileva resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - dragStartX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const itemWidth = containerRef.current?.offsetWidth / mainItems.length || 0;
    const threshold = itemWidth * 0.2;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (dragOffset < 0 && selectedIndex < mainItems.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
    setDragOffset(0);
  };

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragOffset, selectedIndex, navItems.length]);

  const mainItems = navItems.filter(item => !item.isAdminOnly);
  const adminItems = navItems.filter(item => item.isAdminOnly);

  // Calcolo dinamico della larghezza
  const getNavWidth = () => {
    if (isMobile) return 'w-full';
    const itemCount = mainItems.length + (adminItems.length > 0 ? 1 : 0);
    const baseWidth = itemCount * 100; // 100px per item
    return `min-w-[${baseWidth}px]`;
  };

  const itemWidth = 100 / mainItems.length;
  const selectorPosition = selectedIndex * itemWidth + (dragOffset / (containerRef.current?.offsetWidth || 1)) * itemWidth * 100;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 md:w-auto md:px-0">
      <div
        ref={containerRef}
        className={`water-glass-effect rounded-full relative py-2 md:py-3 px-4 md:px-6 flex items-center justify-center md:justify-start gap-0 md:gap-2 ${isMobile ? 'w-full' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ 
          userSelect: 'none', 
          cursor: isDragging ? 'grabbing' : 'grab',
          minWidth: isMobile ? 'auto' : `${Math.max(mainItems.length * 100 + (adminItems.length > 0 ? 50 : 0), 300)}px`
        }}
      >
        {/* Selettore liquido - solo se ci sono mainItems */}
        {mainItems.length > 0 && (
          <div
            className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#26847F]/10 to-[#26847F]/5 hidden md:block"
            style={{
              left: `${selectorPosition}%`,
              width: `${itemWidth}%`,
              transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              boxShadow: isDragging ? 'none' : '0 4px 12px rgba(38, 132, 127, 0.15)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Main nav items */}
        <div className={`relative flex items-center z-10 gap-0.5 md:gap-1 ${isMobile ? 'w-full justify-between' : 'justify-center'}`}>
          {mainItems.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.path)}
                onClick={() => setSelectedIndex(index)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 md:gap-1 
                  px-2 md:px-3 py-2 md:py-2 rounded-lg md:rounded-xl
                  transition-all duration-300 pointer-events-auto
                  ${isMobile ? 'flex-1' : 'min-w-[80px] md:min-w-[100px]'}
                  ${isSelected 
                    ? 'text-[#26847F] md:text-[#26847F]' 
                    : 'text-gray-400 hover:text-gray-600 md:hover:text-[#26847F]'
                  }
                `}
              >
                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs font-medium text-center leading-tight hidden md:block">
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Admin menu - mobile dropdown */}
          {adminItems.length > 0 && isMobile && (
            <div className="relative flex-1">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className={`
                  flex flex-col items-center justify-center gap-0.5
                  px-2 py-2 rounded-lg w-full
                  transition-colors pointer-events-auto
                  ${showAdminMenu 
                    ? 'text-[#26847F]' 
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <MenuIcon className="w-5 h-5" />
              </button>

              {showAdminMenu && (
                <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/40 shadow-xl p-2 min-w-max z-50">
                  {adminItems.map(item => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setShowAdminMenu(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-[#26847F] hover:bg-gray-100/60 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin items - desktop inline */}
          {adminItems.length > 0 && !isMobile && adminItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.path)}
              className={`
                flex flex-col items-center justify-center gap-1
                px-3 py-2 rounded-xl transition-colors pointer-events-auto
                min-w-[100px] text-gray-400 hover:text-[#26847F]
              `}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center leading-tight">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}