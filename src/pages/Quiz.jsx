import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Quiz() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('enquiz'), { replace: true });
  }, [navigate]);

  return null;
}