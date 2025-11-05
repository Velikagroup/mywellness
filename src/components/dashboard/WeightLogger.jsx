
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function WeightLogger({ user, onWeightLogged }) {
  const [weight, setWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!weight || !user) return;
    
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await base44.entities.WeightHistory.create({
        user_id: user.id,
        weight: parseFloat(weight),
        date: today
      });
      
      setWeight('');
      if (onWeightLogged) onWeightLogged();
    } catch (error) {
      console.error("Errore nel salvare il peso:", error);
    }
    setIsSaving(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center shadow-md shadow-[var(--brand-primary)]/30">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-bold text-gray-900">Registra Peso</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              placeholder="70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-center text-xl h-12 pr-12"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              kg
            </span>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!weight || isSaving}
            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva Peso'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
