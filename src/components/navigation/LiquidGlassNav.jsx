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
  const navRef = useRef(null);
  const containerRef = useRef(null);

  // Trova l'indice della pagina attuale
  useEffect(() => {
    const currentIndex = navItems.findIndex(
      item => location.pathname === createPageUrl(item.path)
    );
    if (currentIndex !== -1) {
      setSelectedIndex(currentIndex);
    }
  }, [location.pathname, navItems]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX;
    setDragOffset(delta);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const itemWidth = containerRef.current?.offsetWidth / navItems.length || 0;
    const threshold = itemWidth * 0.2;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (dragOffset < 0 && selectedIndex < navItems.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
    setDragOffset(0);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX, dragOffset, selectedIndex, navItems.length]);

  const itemWidth = 100 / navItems.length;
  const selectorPosition = selectedIndex * itemWidth + (dragOffset / (containerRef.current?.offsetWidth || 1)) * itemWidth * 100;

  const mainItems = navItems.filter(item => !item.isAdminOnly);
  const adminItems = navItems.filter(item => item.isAdminOnly);
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div
        ref={containerRef}
        className="water-glass-effect rounded-3xl relative py-3 px-2"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none', cursor: isDragging ? 'grabbing' : 'grab', width: 'auto' }}
      >
        {/* Selettore liquido */}
        {mainItems.length > 0 && (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-2xl"
            style={{
              left: `${selectorPosition}%`,
              width: `${itemWidth}%`,
              transform: 'translateX(0)',
              transition: isDragging ? 'none' : 'left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              boxShadow: '0 6px 20px rgba(38, 132, 127, 0.25)',
            }}
          />
        )}

        {/* Elementi nav */}
        <div className="relative flex items-center justify-center z-10 gap-1">
          {mainItems.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.path)}
                onClick={() => setSelectedIndex(index)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-max pointer-events-auto ${
                  isSelected ? 'text-[#26847F]' : 'text-gray-400 hover:text-[#26847F]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
              </Link>
            );
          })}

          {adminItems.length > 0 && isMobile && (
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors text-gray-400 hover:text-[#26847F] pointer-events-auto"
                style={{ cursor: 'pointer' }}
              >
                <MenuIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Menu</span>
              </button>

              {showAdminMenu && (
                <div className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/40 shadow-xl p-2 min-w-max">
                  {adminItems.map(item => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => {
                        setShowAdminMenu(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:text-[#26847F] hover:bg-gray-100/50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminItems.length > 0 && !isMobile && adminItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.path)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors text-gray-400 hover:text-[#26847F] pointer-events-auto min-w-max"
              style={{ cursor: 'pointer' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}