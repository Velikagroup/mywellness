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
    
    // ===== FOGLIA SINISTRA (scura, dietro) =====
    ctx.save();
    ctx.translate(-45, 20);
    ctx.rotate(-0.15);
    
    // Forma foglia sinistra - più allungata e appuntita
    const drawLeftLeaf = () => {
      ctx.beginPath();
      ctx.moveTo(0, 90); // punta inferiore
      ctx.bezierCurveTo(-25, 70, -75, 30, -85, -30); // curva sinistra
      ctx.bezierCurveTo(-90, -80, -70, -130, -30, -145); // curva superiore sinistra
      ctx.bezierCurveTo(5, -155, 25, -140, 30, -120); // punta superiore
      ctx.bezierCurveTo(35, -80, 25, 0, 15, 50); // curva destra interna
      ctx.bezierCurveTo(10, 70, 5, 85, 0, 90); // chiusura
      ctx.closePath();
    };
    
    // Gradiente 3D foglia sinistra
    const leftGrad = ctx.createLinearGradient(-80, -100, 30, 60);
    leftGrad.addColorStop(0, '#1a6b66');
    leftGrad.addColorStop(0.3, iconColor1);
    leftGrad.addColorStop(0.7, '#1f7a75');
    leftGrad.addColorStop(1, '#155550');
    
    drawLeftLeaf();
    ctx.fillStyle = leftGrad;
    ctx.fill();
    
    // Ombra interna per profondità
    const leftShadow = ctx.createLinearGradient(-60, 60, 20, -80);
    leftShadow.addColorStop(0, 'rgba(0, 50, 50, 0.4)');
    leftShadow.addColorStop(0.5, 'rgba(0, 50, 50, 0)');
    leftShadow.addColorStop(1, 'rgba(0, 50, 50, 0)');
    
    drawLeftLeaf();
    ctx.fillStyle = leftShadow;
    ctx.fill();
    
    // Riflesso luminoso principale (effetto 3D glass)
    ctx.beginPath();
    ctx.moveTo(-15, 40);
    ctx.bezierCurveTo(-35, 20, -65, -20, -70, -60);
    ctx.bezierCurveTo(-72, -90, -55, -115, -30, -125);
    ctx.bezierCurveTo(-45, -100, -55, -60, -50, -20);
    ctx.bezierCurveTo(-45, 10, -30, 30, -15, 40);
    ctx.closePath();
    
    const leftHighlight = ctx.createLinearGradient(-70, -100, -20, 0);
    leftHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    leftHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    leftHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = leftHighlight;
    ctx.fill();
    
    // Bordo luminoso esterno
    drawLeftLeaf();
    ctx.strokeStyle = 'rgba(80, 200, 200, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Linea interna curva (stelo stilizzato)
    ctx.beginPath();
    ctx.moveTo(-5, 70);
    ctx.bezierCurveTo(-20, 40, -45, -10, -50, -70);
    ctx.strokeStyle = 'rgba(60, 180, 180, 0.5)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.restore();
    
    // ===== FOGLIA DESTRA (chiara, davanti) =====
    ctx.save();
    ctx.translate(50, -25);
    ctx.rotate(0.25);
    
    // Forma foglia destra - più grande e prominente
    const drawRightLeaf = () => {
      ctx.beginPath();
      ctx.moveTo(15, 120); // punta inferiore (coda curva)
      ctx.bezierCurveTo(-15, 100, -70, 50, -95, -10); // curva sinistra
      ctx.bezierCurveTo(-115, -70, -100, -140, -50, -170); // curva superiore
      ctx.bezierCurveTo(-10, -190, 40, -175, 55, -140); // punta superiore appuntita
      ctx.bezierCurveTo(70, -100, 60, -30, 50, 30); // curva destra
      ctx.bezierCurveTo(40, 70, 30, 100, 15, 120); // coda
      ctx.closePath();
    };
    
    // Gradiente 3D foglia destra
    const rightGrad = ctx.createLinearGradient(-90, -120, 60, 80);
    rightGrad.addColorStop(0, '#4eeee5');
    rightGrad.addColorStop(0.25, iconColor2);
    rightGrad.addColorStop(0.5, '#35d4cb');
    rightGrad.addColorStop(0.75, '#28b8b0');
    rightGrad.addColorStop(1, iconColor1);
    
    drawRightLeaf();
    ctx.fillStyle = rightGrad;
    ctx.fill();
    
    // Ombra per profondità 3D
    const rightShadow = ctx.createLinearGradient(40, 100, -40, -60);
    rightShadow.addColorStop(0, 'rgba(0, 80, 80, 0.35)');
    rightShadow.addColorStop(0.4, 'rgba(0, 80, 80, 0)');
    rightShadow.addColorStop(1, 'rgba(0, 80, 80, 0)');
    
    drawRightLeaf();
    ctx.fillStyle = rightShadow;
    ctx.fill();
    
    // Grande riflesso luminoso (effetto liquid glass)
    ctx.beginPath();
    ctx.moveTo(-20, 60);
    ctx.bezierCurveTo(-50, 30, -80, -30, -85, -80);
    ctx.bezierCurveTo(-88, -120, -65, -155, -35, -165);
    ctx.bezierCurveTo(-55, -130, -65, -80, -60, -30);
    ctx.bezierCurveTo(-55, 10, -40, 40, -20, 60);
    ctx.closePath();
    
    const rightHighlight = ctx.createLinearGradient(-85, -140, -10, 20);
    rightHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    rightHighlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    rightHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rightHighlight;
    ctx.fill();
    
    // Riflesso secondario più piccolo in alto
    ctx.beginPath();
    ctx.ellipse(-45, -130, 25, 35, -0.5, 0, Math.PI * 2);
    const topHighlight = ctx.createRadialGradient(-45, -130, 0, -45, -130, 35);
    topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topHighlight;
    ctx.fill();
    
    // Bordo luminoso esterno
    drawRightLeaf();
    ctx.strokeStyle = 'rgba(120, 255, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Bordo interno sottile
    ctx.save();
    ctx.scale(0.92, 0.92);
    drawRightLeaf();
    ctx.strokeStyle = 'rgba(150, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    
    // Linea curva interna (stelo)
    ctx.beginPath();
    ctx.moveTo(5, 95);
    ctx.bezierCurveTo(-25, 50, -55, -20, -60, -100);
    ctx.strokeStyle = 'rgba(100, 220, 220, 0.5)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    
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