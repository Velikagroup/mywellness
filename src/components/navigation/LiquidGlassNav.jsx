import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu as MenuIcon, Plus, X as XIcon } from 'lucide-react';

export default function LiquidGlassNav({ navItems, onActionClick, showActionMenu, setShowActionMenu }) {
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [actionMenuOpen, setActionMenuOpen] = useState(showActionMenu || false);
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
    <div className="fixed bottom-6 left-4 z-50 flex items-center justify-start px-0 md:px-0">
      <div
        ref={containerRef}
        className={`water-glass-effect rounded-full relative py-3 md:py-2 px-4 md:px-6 flex items-center justify-start gap-2 ${isMobile ? 'max-w-md' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ 
          userSelect: 'none', 
          cursor: isDragging ? 'grabbing' : 'grab',
          width: isMobile ? 'auto' : 'fit-content'
        }}
      >

        {/* Main nav items */}
        <div className={`relative flex items-center z-10 gap-0.5 md:gap-1 flex-1 ${isMobile ? 'justify-between' : 'justify-center'}`}>
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