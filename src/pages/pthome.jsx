import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Target,
  Utensils,
  Dumbbell,
  TrendingUp,
  Brain,
  Camera,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Activity,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  BrainCircuit,
  Users,
  Globe
} from 'lucide-react';
import { motion, useScroll, useTransform } from "framer-motion";
import { LanguageProvider, useLanguage, SUPPORTED_LANGUAGES } from '@/components/i18n/LanguageContext';
import { translations } from '@/components/i18n/translations';
import WorkoutPreviewDemo from "../components/home/WorkoutPreviewDemo";
import MealPlanPreviewDemo from "../components/home/MealPlanPreviewDemo";
import PhotoAnalyzerPreviewDemo from "../components/home/PhotoAnalyzerPreviewDemo";
import QuizPreviewDemo from "../components/home/QuizPreviewDemo";
import DashboardPreviewDemo from "../components/home/DashboardPreviewDemo";
import HealthScorePreviewDemo from "../components/home/HealthScorePreviewDemo";
import ShoppingListPreviewDemo from "../components/home/ShoppingListPreviewDemo";
import IngredientScannerPreviewDemo from "../components/home/IngredientScannerPreviewDemo";
import PantryPreviewDemo from "../components/home/PantryPreviewDemo";
import MealTrackingPreviewDemo from "../components/home/MealTrackingPreviewDemo";
import ProgressPhotoPreviewDemo from "../components/home/ProgressPhotoPreviewDemo";
import AppDemoFlow from "../components/home/AppDemoFlow";
import SportQuizPreviewDemo from "../components/home/SportQuizPreviewDemo";
import Home from './Home';

export default function PtHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'pt');
  }, []);

  return (
    <LanguageProvider forcedLanguage="pt">
      <Home />
    </LanguageProvider>
  );
}