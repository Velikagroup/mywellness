import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  useEffect(() => {
    // Redirect all'autenticazione Base44
    window.location.href = 'https://projectmywellness.com/login';
  }, []);

  return (
    <div className="min-h-screen animated-gradient-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full water-glass-effect border-gray-200/30">
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F] mx-auto mb-4"></div>
          <p className="text-gray-600">Reindirizzamento al login...</p>
        </CardContent>
      </Card>
    </div>
  );
}