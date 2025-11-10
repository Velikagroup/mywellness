import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Sfondo() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%, 50% 10%, 20% 70%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%, 90% 50%, 40% 90%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%, 60% 60%, 10% 30%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%, 50% 10%, 20% 70%;
          }
        }
        
        .animated-gradient-bg {
          background: #f9fafb;
          background-image: 
            radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 30%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 35%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 30%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 35%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 40%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 30%),
            radial-gradient(circle at 40% 30%, #c2ebe6 0%, transparent 35%),
            radial-gradient(circle at 60% 75%, #a8e0d7 0%, transparent 30%);
          background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
          animation: gradientShift 45s linear infinite;
          background-attachment: fixed;
        }
        
        @media (max-width: 768px) {
          .animated-gradient-bg {
            animation: gradientShift 30s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}