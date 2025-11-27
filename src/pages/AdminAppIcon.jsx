import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Layers, Eye, EyeOff } from "lucide-react";

export default function AdminAppIcon() {
  const canvasRef = useRef(null);
  const [iconSize] = useState(512);
  const [showBackground, setShowBackground] = useState(true);
  const [showIcon, setShowIcon] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Colori personalizzabili
  const [bgColor1, setBgColor1] = useState('#e0f7f5');
  const [bgColor2, setBgColor2] = useState('#c2ebe6');
  const [iconColor1, setIconColor1] = useState('#26847F');
  const [iconColor2, setIconColor2] = useState('#3dd9d0');
  const [superellipseN, setSuperellipseN] = useState(5); // n=5 per iOS-like squircle

  // Disegna superellisse (squircle iOS)
  const drawSuperellipse = (ctx, cx, cy, a, b, n, steps = 200) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      const x = cx + Math.sign(cosT) * a * Math.pow(Math.abs(cosT), 2 / n);
      const y = cy + Math.sign(sinT) * b * Math.pow(Math.abs(sinT), 2 / n);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  };

  const drawBackground = (ctx, size) => {
    const padding = size * 0.02;
    const innerSize = size - padding * 2;
    const cx = size / 2;
    const cy = size / 2;
    const radius = innerSize / 2;
    
    // Sfondo principale con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, bgColor1);
    gradient.addColorStop(0.5, '#f0fafa');
    gradient.addColorStop(1, bgColor2);
    
    drawSuperellipse(ctx, cx, cy, radius, radius, superellipseN);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Effetto liquid glass - bordo luminoso esterno
    drawSuperellipse(ctx, cx, cy, radius, radius, superellipseN);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = size * 0.012;
    ctx.stroke();
    
    // Bordo interno sottile
    drawSuperellipse(ctx, cx, cy, radius * 0.97, radius * 0.97, superellipseN);
    ctx.strokeStyle = 'rgba(0, 180, 180, 0.15)';
    ctx.lineWidth = size * 0.008;
    ctx.stroke();
    
    // Riflesso superiore (liquid glass effect)
    ctx.save();
    drawSuperellipse(ctx, cx, cy, radius, radius, superellipseN);
    ctx.clip();
    
    const reflectGradient = ctx.createLinearGradient(0, padding, 0, size * 0.5);
    reflectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    reflectGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    reflectGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.3, radius * 0.85, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = reflectGradient;
    ctx.fill();
    ctx.restore();
    
    // Ombra inferiore interna
    ctx.save();
    drawSuperellipse(ctx, cx, cy, radius, radius, superellipseN);
    ctx.clip();
    
    const shadowGradient = ctx.createLinearGradient(0, size * 0.7, 0, size);
    shadowGradient.addColorStop(0, 'rgba(0, 100, 100, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 100, 100, 0.1)');
    
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.5, radius * 0.9, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowGradient;
    ctx.fill();
    ctx.restore();
  };

  const drawIcon = (ctx, size) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 512;
    
    // Foglia sinistra (più scura)
    ctx.save();
    ctx.translate(centerX - 55 * scale, centerY + 25 * scale);
    ctx.scale(scale, scale);
    
    // Gradiente foglia sinistra
    const leftGradient = ctx.createLinearGradient(-80, -120, 40, 80);
    leftGradient.addColorStop(0, iconColor1);
    leftGradient.addColorStop(1, '#1a5f5a');
    
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(-120, 40, -120, -120, 0, -120);
    ctx.bezierCurveTo(40, -80, 40, 40, 0, 80);
    ctx.fillStyle = leftGradient;
    ctx.fill();
    
    // Effetto glass - highlight interno
    ctx.beginPath();
    ctx.moveTo(-10, 55);
    ctx.bezierCurveTo(-95, 20, -95, -95, -10, -95);
    ctx.bezierCurveTo(15, -70, 15, 30, -10, 55);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 10;
    ctx.stroke();
    
    // Riflesso interno foglia sinistra
    const leftReflect = ctx.createRadialGradient(-45, -55, 0, -45, -55, 50);
    leftReflect.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    leftReflect.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.ellipse(-45, -55, 28, 42, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = leftReflect;
    ctx.fill();
    
    // Bordo luminoso foglia sinistra
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(-120, 40, -120, -120, 0, -120);
    ctx.bezierCurveTo(40, -80, 40, 40, 0, 80);
    ctx.strokeStyle = 'rgba(100, 220, 220, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
    
    // Foglia destra (più chiara)
    ctx.save();
    ctx.translate(centerX + 45 * scale, centerY - 15 * scale);
    ctx.scale(scale, scale);
    ctx.rotate(0.3);
    
    // Gradiente foglia destra
    const rightGradient = ctx.createLinearGradient(-60, -140, 60, 60);
    rightGradient.addColorStop(0, iconColor2);
    rightGradient.addColorStop(0.5, '#2dd4bf');
    rightGradient.addColorStop(1, iconColor1);
    
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.bezierCurveTo(-140, 60, -140, -140, 0, -140);
    ctx.bezierCurveTo(60, -100, 60, 60, 0, 100);
    ctx.fillStyle = rightGradient;
    ctx.fill();
    
    // Effetto glass - highlight interno
    ctx.beginPath();
    ctx.moveTo(-10, 75);
    ctx.bezierCurveTo(-115, 40, -115, -115, -10, -115);
    ctx.bezierCurveTo(25, -85, 25, 45, -10, 75);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 12;
    ctx.stroke();
    
    // Riflesso interno foglia destra
    const rightReflect = ctx.createRadialGradient(-40, -65, 0, -40, -65, 55);
    rightReflect.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    rightReflect.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.ellipse(-40, -65, 32, 52, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = rightReflect;
    ctx.fill();
    
    // Bordo luminoso foglia destra
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.bezierCurveTo(-140, 60, -140, -140, 0, -140);
    ctx.bezierCurveTo(60, -100, 60, 60, 0, 100);
    ctx.strokeStyle = 'rgba(150, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
  };

  const exportLayer = async (layerType, scale = 10) => {
    setIsExporting(true);
    
    const canvas = document.createElement('canvas');
    const size = iconSize * scale;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Applica scaling
    ctx.scale(scale, scale);
    
    if (layerType === 'background' || layerType === 'full') {
      drawBackground(ctx, iconSize);
    }
    
    if (layerType === 'icon' || layerType === 'full') {
      drawIcon(ctx, iconSize);
    }
    
    // Esporta come PNG
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `mywellness-${layerType}-${size}x${size}.png`;
    link.href = dataUrl;
    link.click();
    
    setIsExporting(false);
  };

  // Preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, iconSize, iconSize);
    
    if (showBackground) {
      drawBackground(ctx, iconSize);
    }
    
    if (showIcon) {
      drawIcon(ctx, iconSize);
    }
  }, [showBackground, showIcon, bgColor1, bgColor2, iconColor1, iconColor2, superellipseN]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 App Icon Generator</h1>
        <p className="text-gray-600 mb-8">Crea l'icona per iOS App Store e Android Play Store con effetto liquid glass</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Anteprima Icona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-8 bg-gray-900 rounded-xl">
                <canvas 
                  ref={canvasRef}
                  width={iconSize}
                  height={iconSize}
                  className="shadow-2xl"
                  style={{ width: 300, height: 300 }}
                />
              </div>
              
              <div className="flex gap-4 mt-6 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowBackground(!showBackground)}
                  className={!showBackground ? 'opacity-50' : ''}
                >
                  {showBackground ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  Sfondo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowIcon(!showIcon)}
                  className={!showIcon ? 'opacity-50' : ''}
                >
                  {showIcon ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  Icona
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controlli */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sfondo (Superellisse)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Colore 1</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        type="color" 
                        value={bgColor1}
                        onChange={(e) => setBgColor1(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={bgColor1}
                        onChange={(e) => setBgColor1(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Colore 2</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        type="color" 
                        value={bgColor2}
                        onChange={(e) => setBgColor2(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={bgColor2}
                        onChange={(e) => setBgColor2(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Curvatura Superellisse (n={superellipseN})</Label>
                  <p className="text-xs text-gray-500 mb-2">n=2 = ellisse, n=4-5 = iOS squircle, n=10+ = quasi quadrato</p>
                  <Slider
                    value={[superellipseN]}
                    onValueChange={(v) => setSuperellipseN(v[0])}
                    min={2}
                    max={15}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Colori Icona (Foglie)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Foglia Scura</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        type="color" 
                        value={iconColor1}
                        onChange={(e) => setIconColor1(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={iconColor1}
                        onChange={(e) => setIconColor1(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Foglia Chiara</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        type="color" 
                        value={iconColor2}
                        onChange={(e) => setIconColor2(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={iconColor2}
                        onChange={(e) => setIconColor2(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-[#26847F]">
              <CardHeader>
                <CardTitle className="text-[#26847F]">📥 Esporta PNG (5120x5120px)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => exportLayer('background', 10)}
                  disabled={isExporting}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Solo Sfondo (Layer 1)
                </Button>
                <Button
                  onClick={() => exportLayer('icon', 10)}
                  disabled={isExporting}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Solo Icona (Layer 2)
                </Button>
                <Button
                  onClick={() => exportLayer('full', 10)}
                  disabled={isExporting}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Icona Completa
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Esportazione a 10x (512px base → 5120px output) per massima qualità App Store
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}