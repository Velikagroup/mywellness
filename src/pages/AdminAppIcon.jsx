import React, { useRef, useState } from 'react';
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
  const [borderRadius, setBorderRadius] = useState(100);

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
      drawBackground(ctx, iconSize, borderRadius);
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

  const drawBackground = (ctx, size, radius) => {
    const padding = size * 0.02;
    const innerSize = size - padding * 2;
    const r = (radius / 100) * (innerSize / 4);
    
    // Sfondo principale con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, bgColor1);
    gradient.addColorStop(0.5, '#f0fafa');
    gradient.addColorStop(1, bgColor2);
    
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerSize, innerSize, r);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Effetto liquid glass - bordo luminoso
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerSize, innerSize, r);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = size * 0.008;
    ctx.stroke();
    
    // Riflesso superiore
    const reflectGradient = ctx.createLinearGradient(0, padding, 0, size * 0.4);
    reflectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    reflectGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.roundRect(padding + size * 0.05, padding + size * 0.02, innerSize - size * 0.1, size * 0.25, r * 0.8);
    ctx.fillStyle = reflectGradient;
    ctx.fill();
    
    // Ombra interna sottile
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerSize, innerSize, r);
    ctx.strokeStyle = 'rgba(0, 100, 100, 0.15)';
    ctx.lineWidth = size * 0.015;
    ctx.stroke();
  };

  const drawIcon = (ctx, size) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 512;
    
    // Foglia sinistra (più scura)
    ctx.save();
    ctx.translate(centerX - 60 * scale, centerY + 20 * scale);
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
    
    // Effetto glass sulla foglia sinistra
    ctx.beginPath();
    ctx.moveTo(-10, 60);
    ctx.bezierCurveTo(-100, 20, -100, -100, -10, -100);
    ctx.bezierCurveTo(10, -70, 10, 30, -10, 60);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Riflesso interno
    const leftReflect = ctx.createLinearGradient(-60, -80, -20, -40);
    leftReflect.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    leftReflect.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.ellipse(-40, -60, 25, 40, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = leftReflect;
    ctx.fill();
    
    ctx.restore();
    
    // Foglia destra (più chiara)
    ctx.save();
    ctx.translate(centerX + 40 * scale, centerY - 20 * scale);
    ctx.scale(scale, scale);
    ctx.rotate(0.3);
    
    // Gradiente foglia destra
    const rightGradient = ctx.createLinearGradient(-60, -140, 60, 60);
    rightGradient.addColorStop(0, iconColor2);
    rightGradient.addColorStop(1, iconColor1);
    
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.bezierCurveTo(-140, 60, -140, -140, 0, -140);
    ctx.bezierCurveTo(60, -100, 60, 60, 0, 100);
    ctx.fillStyle = rightGradient;
    ctx.fill();
    
    // Effetto glass sulla foglia destra
    ctx.beginPath();
    ctx.moveTo(-10, 80);
    ctx.bezierCurveTo(-120, 40, -120, -120, -10, -120);
    ctx.bezierCurveTo(20, -90, 20, 50, -10, 80);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Riflesso interno
    const rightReflect = ctx.createLinearGradient(-50, -100, 0, -50);
    rightReflect.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    rightReflect.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.ellipse(-35, -70, 30, 50, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = rightReflect;
    ctx.fill();
    
    ctx.restore();
  };

  // Preview canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, iconSize, iconSize);
    
    if (showBackground) {
      drawBackground(ctx, iconSize, borderRadius);
    }
    
    if (showIcon) {
      drawIcon(ctx, iconSize);
    }
  }, [showBackground, showIcon, bgColor1, bgColor2, iconColor1, iconColor2, borderRadius]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🎨 App Icon Generator</h1>
        
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
                  className="rounded-3xl shadow-2xl"
                  style={{ width: 300, height: 300 }}
                />
              </div>
              
              <div className="flex gap-4 mt-6">
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
                <CardTitle>Colori Sfondo</CardTitle>
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
                  <Label>Raggio Bordi: {borderRadius}%</Label>
                  <Slider
                    value={[borderRadius]}
                    onValueChange={(v) => setBorderRadius(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Colori Icona</CardTitle>
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
                <CardTitle className="text-[#26847F]">📥 Esporta a 10x (5120x5120px)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => exportLayer('background', 10)}
                  disabled={isExporting}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Solo Sfondo
                </Button>
                <Button
                  onClick={() => exportLayer('icon', 10)}
                  disabled={isExporting}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Solo Icona
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
                  Le immagini vengono esportate a 5120x5120 pixel (10x la dimensione base 512px)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}