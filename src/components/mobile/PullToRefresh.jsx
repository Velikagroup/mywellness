import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [0, 1]);
  const rotate = useTransform(y, [0, 100], [0, 360]);

  const handleDragEnd = async (event, info) => {
    if (info.offset.y > 100 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <motion.div
        style={{
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity
        }}
      >
        <motion.div style={{ rotate }}>
          <RefreshCw className={`w-6 h-6 text-[#26847F] ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.div>
      </motion.div>
      
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y, touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}