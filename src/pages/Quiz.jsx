import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

import { LanguageProvider } from '../components/i18n/LanguageContext';
import { translations } from '../components/i18n/translations';
import QuizContainer from '../components/quiz/QuizContainer';

export default function QuizPage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'en');
  }, []);

  return (
    <LanguageProvider forcedLanguage="en">
      <QuizContainer translations={translations.en} language="en" />
    </LanguageProvider>
  );
}