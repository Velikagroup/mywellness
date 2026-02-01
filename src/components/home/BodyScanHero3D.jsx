import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useLanguage } from '../i18n/LanguageContext';

export default function BodyScanHero3D() {
  const { language, t } = useLanguage();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    
    renderer.setSize(300, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Figura umana realistica con proporzioni anatomiche
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x26847F,
      transparent: true,
      opacity: 0.85,
      shininess: 40,
      emissive: 0x1a5753,
      emissiveIntensity: 0.1
    });

    const skinMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf4a460,
      transparent: true,
      opacity: 0.9,
      shininess: 25
    });

    const group = new THREE.Group();

    // Testa realistica
    const headGeometry = new THREE.IcosahedronGeometry(0.35, 4);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 3.4;
    head.scale.set(1, 1.1, 0.95);
    group.add(head);

    // Collo
    const neckGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 16);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = 3;
    group.add(neck);

    // Spalle (larghezza realistica)
    const shoulderGeometry = new THREE.SphereGeometry(0.22, 12, 12);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
    leftShoulder.position.set(-0.7, 2.65, 0);
    leftShoulder.scale.set(1.2, 0.8, 0.9);
    group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
    rightShoulder.position.set(0.7, 2.65, 0);
    rightShoulder.scale.set(1.2, 0.8, 0.9);
    group.add(rightShoulder);

    // Petto
    const chestGeometry = new THREE.CylinderGeometry(0.55, 0.5, 1.1, 16);
    const chest = new THREE.Mesh(chestGeometry, bodyMaterial);
    chest.position.y = 2.1;
    group.add(chest);

    // Addome
    const abdominalGeometry = new THREE.CylinderGeometry(0.52, 0.48, 1, 16);
    const abdomen = new THREE.Mesh(abdominalGeometry, bodyMaterial);
    abdomen.position.y = 1;
    group.add(abdomen);

    // Bacino/Fianchi
    const pelvisGeometry = new THREE.CylinderGeometry(0.5, 0.42, 0.8, 16);
    const pelvis = new THREE.Mesh(pelvisGeometry, bodyMaterial);
    pelvis.position.y = 0.15;
    group.add(pelvis);

    // Braccia sinistre (superiore)
    const upperArmLGeometry = new THREE.CylinderGeometry(0.14, 0.11, 1, 12);
    const upperArmL = new THREE.Mesh(upperArmLGeometry, skinMaterial);
    upperArmL.position.set(-0.9, 2.3, 0);
    upperArmL.rotation.z = 0.4;
    group.add(upperArmL);

    // Braccia sinistre (inferiore)
    const forearmLGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.95, 12);
    const forearmL = new THREE.Mesh(forearmLGeometry, skinMaterial);
    forearmL.position.set(-1.35, 1.5, 0);
    forearmL.rotation.z = 0.6;
    group.add(forearmL);

    // Braccia destra (superiore)
    const upperArmRGeometry = new THREE.CylinderGeometry(0.14, 0.11, 1, 12);
    const upperArmR = new THREE.Mesh(upperArmRGeometry, skinMaterial);
    upperArmR.position.set(0.9, 2.3, 0);
    upperArmR.rotation.z = -0.4;
    group.add(upperArmR);

    // Braccia destra (inferiore)
    const forearmRGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.95, 12);
    const forearmR = new THREE.Mesh(forearmRGeometry, skinMaterial);
    forearmR.position.set(1.35, 1.5, 0);
    forearmR.rotation.z = -0.6;
    group.add(forearmR);

    // Mani
    const handGeometry = new THREE.SphereGeometry(0.08, 10, 10);
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(-1.5, 1, 0);
    leftHand.scale.set(1, 1.2, 0.8);
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(1.5, 1, 0);
    rightHand.scale.set(1, 1.2, 0.8);
    group.add(rightHand);

    // Gambe sinistre (coscia)
    const thighLGeometry = new THREE.CylinderGeometry(0.2, 0.17, 1.2, 12);
    const thighL = new THREE.Mesh(thighLGeometry, skinMaterial);
    thighL.position.set(-0.3, -0.7, 0);
    group.add(thighL);

    // Gambe sinistre (polpaccio)
    const calfLGeometry = new THREE.CylinderGeometry(0.14, 0.1, 1.1, 12);
    const calfL = new THREE.Mesh(calfLGeometry, skinMaterial);
    calfL.position.set(-0.3, -1.95, 0);
    group.add(calfL);

    // Piede sinistro
    const footLGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.25);
    const footL = new THREE.Mesh(footLGeometry, skinMaterial);
    footL.position.set(-0.3, -2.7, 0.1);
    group.add(footL);

    // Gambe destre (coscia)
    const thighRGeometry = new THREE.CylinderGeometry(0.2, 0.17, 1.2, 12);
    const thighR = new THREE.Mesh(thighRGeometry, skinMaterial);
    thighR.position.set(0.3, -0.7, 0);
    group.add(thighR);

    // Gambe destre (polpaccio)
    const calfRGeometry = new THREE.CylinderGeometry(0.14, 0.1, 1.1, 12);
    const calfR = new THREE.Mesh(calfRGeometry, skinMaterial);
    calfR.position.set(0.3, -1.95, 0);
    group.add(calfR);

    // Piede destro
    const footRGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.25);
    const footR = new THREE.Mesh(footRGeometry, skinMaterial);
    footR.position.set(0.3, -2.7, 0.1);
    group.add(footR);

    // Griglia di scansione
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.6
    });

    // Linee orizzontali di scansione
    for (let i = -1; i <= 3.5; i += 0.3) {
      const points = [];
      const segments = 24;
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = Math.cos(angle) * 0.8;
        const z = Math.sin(angle) * 0.8;
        points.push(new THREE.Vector3(x, i, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      group.add(line);
    }

    scene.add(group);

    // Luce ambientale
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luce direzionale
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 4, 3);
    scene.add(directionalLight);

    // Luce di riempimento
    const fillLight = new THREE.DirectionalLight(0x26847F, 0.3);
    fillLight.position.set(-2, 2, -3);
    scene.add(fillLight);

    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1.5, 0);

    // Animazione
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;
      
      // Rotazione lenta del gruppo
      group.rotation.y = Math.sin(time * 0.5) * 0.3;
      
      // Animazione delle linee di scansione
      group.children.forEach((child, index) => {
        if (child instanceof THREE.Line) {
          child.material.opacity = 0.3 + Math.sin(time * 2 + index * 0.5) * 0.3;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-16">
      {/* Figura 3D */}
      <div className="relative">
        <canvas ref={canvasRef} className="w-[300px] h-[400px]" />
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-[#26847F]/10 border border-[#26847F]/30 rounded-full backdrop-blur-sm">
          <p className="text-xs font-semibold text-[#26847F]">
            {language === 'it' ? 'Scansione AI in corso...' :
             language === 'en' ? 'AI Scanning...' :
             language === 'es' ? 'Escaneo IA...' :
             language === 'pt' ? 'Escaneamento IA...' :
             language === 'de' ? 'KI-Scan...' :
             'Scan IA en cours...'}
          </p>
        </div>
      </div>

      {/* Mockup Telefono con Dashboard */}
      <div className="relative">
        {/* Phone Frame */}
        <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl" style={{ width: '320px', height: '650px' }}>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
          
          {/* Screen */}
          <div className="relative bg-white rounded-[2.5rem] w-full h-full overflow-hidden">
            {/* Dashboard Content */}
            <div className="p-6 h-full overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Body Scan</h3>
                <p className="text-xs text-gray-500">
                  {language === 'it' ? 'Analisi del 15 Gen 2026' :
                   language === 'en' ? 'Analysis from Jan 15, 2026' :
                   language === 'es' ? 'Análisis del 15 Ene 2026' :
                   language === 'pt' ? 'Análise de 15 Jan 2026' :
                   language === 'de' ? 'Analyse vom 15. Jan 2026' :
                   'Analyse du 15 Jan 2026'}
                </p>
              </div>

              {/* Somatotype Card */}
              <div className="bg-gradient-to-br from-[#26847F]/10 to-teal-50 rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {language === 'it' ? 'Somatotipo' :
                   language === 'en' ? 'Somatotype' :
                   language === 'es' ? 'Somatotipo' :
                   language === 'pt' ? 'Somatotipo' :
                   language === 'de' ? 'Somatotyp' :
                   'Somatotype'}
                </p>
                <p className="text-2xl font-bold text-[#26847F]">Mesomorfo</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'it' ? 'Massa Grassa' :
                     language === 'en' ? 'Body Fat' :
                     language === 'es' ? 'Grasa Corporal' :
                     language === 'pt' ? 'Gordura Corporal' :
                     language === 'de' ? 'Körperfett' :
                     'Masse Grasse'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">18.5%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'it' ? 'Definizione' :
                     language === 'en' ? 'Definition' :
                     language === 'es' ? 'Definición' :
                     language === 'pt' ? 'Definição' :
                     language === 'de' ? 'Definition' :
                     'Définition'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">7.2/10</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'it' ? 'Età Biologica' :
                     language === 'en' ? 'Biological Age' :
                     language === 'es' ? 'Edad Biológica' :
                     language === 'pt' ? 'Idade Biológica' :
                     language === 'de' ? 'Biologisches Alter' :
                     'Âge Biologique'}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    28 {language === 'it' ? 'anni' :
                        language === 'en' ? 'years' :
                        language === 'es' ? 'años' :
                        language === 'pt' ? 'anos' :
                        language === 'de' ? 'Jahre' :
                        'ans'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'it' ? 'Postura' :
                     language === 'en' ? 'Posture' :
                     language === 'es' ? 'Postura' :
                     language === 'pt' ? 'Postura' :
                     language === 'de' ? 'Haltung' :
                     'Posture'}
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {language === 'it' ? 'Buona' :
                     language === 'en' ? 'Good' :
                     language === 'es' ? 'Buena' :
                     language === 'pt' ? 'Boa' :
                     language === 'de' ? 'Gut' :
                     'Bonne'}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <p className="text-xs font-semibold text-gray-900">
                    {language === 'it' ? 'Raccomandazioni AI' :
                     language === 'en' ? 'AI Recommendations' :
                     language === 'es' ? 'Recomendaciones IA' :
                     language === 'pt' ? 'Recomendações IA' :
                     language === 'de' ? 'KI-Empfehlungen' :
                     'Recommandations IA'}
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>
                      {language === 'it' ? 'Aumenta proteine a 1.8g/kg' :
                       language === 'en' ? 'Increase protein to 1.8g/kg' :
                       language === 'es' ? 'Aumenta proteínas a 1.8g/kg' :
                       language === 'pt' ? 'Aumentar proteínas para 1.8g/kg' :
                       language === 'de' ? 'Protein auf 1.8g/kg erhöhen' :
                       'Augmenter protéines à 1.8g/kg'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>
                      {language === 'it' ? 'Aggiungi 3 sessioni HIIT' :
                       language === 'en' ? 'Add 3 HIIT sessions' :
                       language === 'es' ? 'Añade 3 sesiones HIIT' :
                       language === 'pt' ? 'Adicionar 3 sessões HIIT' :
                       language === 'de' ? '3 HIIT-Sitzungen hinzufügen' :
                       'Ajouter 3 séances HIIT'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}