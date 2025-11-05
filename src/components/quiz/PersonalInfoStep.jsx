import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Ruler, Weight } from "lucide-react";

export default function PersonalInfoStep({ data, onDataChange }) {
  const handleInputChange = (field, value) => {
    onDataChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
        <p className="text-white/70">Basic information to personalize your wellness plan</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <User className="w-4 h-4" />
            Gender
          </Label>
          <Select 
            value={data.gender || ''} 
            onValueChange={(value) => handleInputChange('gender', value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Age
          </Label>
          <Input
            type="number"
            placeholder="Enter your age"
            value={data.age || ''}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
            className="bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Height (cm)
          </Label>
          <Input
            type="number"
            placeholder="Enter your height"
            value={data.height || ''}
            onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
            className="bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Weight className="w-4 h-4" />
            Current Weight (kg)
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter current weight"
            value={data.current_weight || ''}
            onChange={(e) => handleInputChange('current_weight', parseFloat(e.target.value))}
            className="bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Weight className="w-4 h-4" />
            Target Weight (kg)
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter target weight"
            value={data.target_weight || ''}
            onChange={(e) => handleInputChange('target_weight', parseFloat(e.target.value))}
            className="bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>
      </div>

      {/* Body Measurements */}
      <div className="pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Body Measurements (Optional)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Neck (cm)</Label>
            <Input
              type="number"
              placeholder="Neck circumference"
              value={data.neck_circumference || ''}
              onChange={(e) => handleInputChange('neck_circumference', parseFloat(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Waist (cm)</Label>
            <Input
              type="number"
              placeholder="Waist circumference"
              value={data.waist_circumference || ''}
              onChange={(e) => handleInputChange('waist_circumference', parseFloat(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Hips (cm)</Label>
            <Input
              type="number"
              placeholder="Hip circumference"
              value={data.hip_circumference || ''}
              onChange={(e) => handleInputChange('hip_circumference', parseFloat(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}