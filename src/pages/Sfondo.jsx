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
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }
        
        .animated-gradient-bg {
          background: #e8f4f8;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.8) 0%, transparent 35%),
            radial-gradient(circle at 85% 10%, rgba(16, 185, 129, 0.75) 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.7) 0%, transparent 35%),
            radial-gradient(circle at 70% 60%, rgba(236, 72, 153, 0.75) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.65) 0%, transparent 45%),
            radial-gradient(circle at 90% 85%, rgba(99, 102, 241, 0.7) 0%, transparent 35%),
            radial-gradient(circle at 40% 30%, rgba(14, 165, 233, 0.6) 0%, transparent 40%),
            radial-gradient(circle at 60% 70%, rgba(251, 113, 133, 0.65) 0%, transparent 35%);
          background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
          animation: gradientShift 45s linear infinite;
          background-attachment: fixed;
          mix-blend-mode: normal;
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