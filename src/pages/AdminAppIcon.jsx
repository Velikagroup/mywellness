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
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    
    // ===== CODA CURVA (sotto tutto) =====
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 30, 140, 0.6, 2.5, false);
    ctx.strokeStyle = iconColor1;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Highlight sulla coda
    ctx.beginPath();
    ctx.arc(0, 30, 140, 0.7, 2.3, false);
    ctx.strokeStyle = 'rgba(80, 180, 180, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
    
    // ===== FOGLIA SINISTRA (scura, forma a goccia) =====
    ctx.save();
    ctx.translate(-50, 0);
    
    const drawLeftLeaf = () => {
      ctx.beginPath();
      // Forma a goccia: punta in alto, tonda in basso
      ctx.moveTo(0, -120); // punta superiore
      ctx.bezierCurveTo(50, -100, 75, -50, 75, 10); // curva destra superiore
      ctx.bezierCurveTo(75, 70, 45, 110, 0, 120); // curva destra inferiore
      ctx.bezierCurveTo(-45, 110, -75, 70, -75, 10); // curva sinistra inferiore
      ctx.bezierCurveTo(-75, -50, -50, -100, 0, -120); // curva sinistra superiore
      ctx.closePath();
    };
    
    // Gradiente foglia sinistra
    const leftGrad = ctx.createLinearGradient(-60, -80, 60, 80);
    leftGrad.addColorStop(0, '#267a75');
    leftGrad.addColorStop(0.4, iconColor1);
    leftGrad.addColorStop(0.7, '#1f6b66');
    leftGrad.addColorStop(1, '#185855');
    
    drawLeftLeaf();
    ctx.fillStyle = leftGrad;
    ctx.fill();
    
    // Bordo esterno
    drawLeftLeaf();
    ctx.strokeStyle = '#3a9590';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Highlight interno (effetto 3D glass)
    ctx.beginPath();
    ctx.moveTo(-15, -90);
    ctx.bezierCurveTo(-55, -60, -55, 20, -35, 70);
    ctx.strokeStyle = 'rgba(100, 200, 200, 0.6)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Riflesso luminoso superiore
    ctx.beginPath();
    ctx.ellipse(-25, -50, 20, 40, -0.3, 0, Math.PI * 2);
    const leftHighlight = ctx.createRadialGradient(-25, -50, 0, -25, -50, 40);
    leftHighlight.addColorStop(0, 'rgba(150, 220, 220, 0.5)');
    leftHighlight.addColorStop(1, 'rgba(150, 220, 220, 0)');
    ctx.fillStyle = leftHighlight;
    ctx.fill();
    
    ctx.restore();
    
    // ===== FOGLIA DESTRA (chiara, forma allungata appuntita) =====
    ctx.save();
    ctx.translate(55, -30);
    ctx.rotate(0.15);
    
    const drawRightLeaf = () => {
      ctx.beginPath();
      // Forma allungata con punta in alto e coda in basso
      ctx.moveTo(0, -140); // punta superiore appuntita
      ctx.bezierCurveTo(35, -120, 55, -70, 55, -20); // curva destra superiore
      ctx.bezierCurveTo(55, 40, 40, 90, 15, 130); // curva destra con coda
      ctx.bezierCurveTo(5, 145, -5, 145, -15, 130); // punta coda
      ctx.bezierCurveTo(-35, 90, -50, 40, -55, -20); // curva sinistra inferiore
      ctx.bezierCurveTo(-55, -70, -35, -120, 0, -140); // curva sinistra superiore
      ctx.closePath();
    };
    
    // Gradiente foglia destra (chiara cyan)
    const rightGrad = ctx.createLinearGradient(-50, -100, 50, 100);
    rightGrad.addColorStop(0, '#5eeee8');
    rightGrad.addColorStop(0.3, iconColor2);
    rightGrad.addColorStop(0.6, '#3dd9d0');
    rightGrad.addColorStop(1, '#30c5bd');
    
    drawRightLeaf();
    ctx.fillStyle = rightGrad;
    ctx.fill();
    
    // Bordo esterno
    drawRightLeaf();
    ctx.strokeStyle = '#50ddd5';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Grande riflesso interno (effetto liquid glass)
    ctx.beginPath();
    ctx.moveTo(-20, -110);
    ctx.bezierCurveTo(-45, -70, -45, 0, -30, 60);
    ctx.strokeStyle = 'rgba(200, 255, 255, 0.7)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Riflesso luminoso secondario
    ctx.beginPath();
    ctx.moveTo(-10, 70);
    ctx.bezierCurveTo(-25, 90, -15, 110, 0, 115);
    ctx.strokeStyle = 'rgba(180, 255, 255, 0.5)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Riflesso luminoso superiore (bolla)
    ctx.beginPath();
    ctx.ellipse(-20, -70, 18, 35, -0.2, 0, Math.PI * 2);
    const rightHighlight = ctx.createRadialGradient(-20, -70, 0, -20, -70, 35);
    rightHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    rightHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    rightHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rightHighlight;
    ctx.fill();
    
    ctx.restore();
    
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