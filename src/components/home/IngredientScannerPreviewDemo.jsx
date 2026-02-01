import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Scan, Check, Database, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function IngredientScannerPreviewDemo() {
  const { t, language } = useLanguage();
  const [scanStep, setScanStep] = useState(0);

  const translations = React.useMemo(() => ({
    it: {
      title: 'Scanner Ingredienti AI',
      subtitle: 'Scansiona codici a barre e etichette',
      database: '🍗 Database 50.000+ Alimenti',
      frameBarcode: 'Inquadra il Codice a Barre',
      orLabel: 'oppure l\'etichetta nutrizionale',
      scanning: 'Scansione in corso...',
      recognition: 'Riconoscimento AI attivo',
      recognized: 'Prodotto Riconosciuto!',
      dbMatch: 'Trovato nel Database',
      accuracy: 'accuratezza',
      productName: 'Petto di Pollo 100g',
      realValues: 'Valori Nutrizionali Reali',
      protein: 'Proteine',
      carbs: 'Carboidrati',
      fat: 'Grassi',
      per: 'Per',
      addToPlan: '+ Aggiungi al Piano',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      title: 'AI Ingredient Scanner',
      subtitle: 'Scan barcodes and labels',
      database: '🍗 50,000+ Food Database',
      frameBarcode: 'Frame the Barcode',
      orLabel: 'or the nutritional label',
      scanning: 'Scanning...',
      recognition: 'AI recognition active',
      recognized: 'Product Recognized!',
      dbMatch: 'Found in Database',
      accuracy: 'accuracy',
      productName: 'Chicken Breast 100g',
      realValues: 'Real Nutritional Values',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      per: 'Per',
      addToPlan: '+ Add to Plan',
      preview: 'Interface preview • Features available after signup'
    },
    es: {
      title: 'Escáner de Ingredientes IA',
      subtitle: 'Escanea códigos de barras y etiquetas',
      database: '🍗 Base de Datos 50.000+ Alimentos',
      frameBarcode: 'Encuadra el Código de Barras',
      orLabel: 'o la etiqueta nutricional',
      scanning: 'Escaneando...',
      recognition: 'Reconocimiento IA activo',
      recognized: '¡Producto Reconocido!',
      dbMatch: 'Encontrado en Base de Datos',
      accuracy: 'precisión',
      productName: 'Pechuga de Pollo 100g',
      realValues: 'Valores Nutricionales Reales',
      protein: 'Proteínas',
      carbs: 'Carbohidratos',
      fat: 'Grasas',
      per: 'Por',
      addToPlan: '+ Añadir al Plan',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      title: 'Scanner de Ingredientes IA',
      subtitle: 'Digitalize códigos de barras e rótulos',
      database: '🍗 Base de Dados 50.000+ Alimentos',
      frameBarcode: 'Enquadre o Código de Barras',
      orLabel: 'ou o rótulo nutricional',
      scanning: 'Digitalizando...',
      recognition: 'Reconhecimento IA ativo',
      recognized: 'Produto Reconhecido!',
      dbMatch: 'Encontrado na Base de Dados',
      accuracy: 'precisão',
      productName: 'Peito de Frango 100g',
      realValues: 'Valores Nutricionais Reais',
      protein: 'Proteínas',
      carbs: 'Carboidratos',
      fat: 'Gorduras',
      per: 'Por',
      addToPlan: '+ Adicionar ao Plano',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      title: 'KI-Zutaten-Scanner',
      subtitle: 'Scannen Sie Barcodes und Etiketten',
      database: '🍗 50.000+ Lebensmittel-Datenbank',
      frameBarcode: 'Barcode Einrahmen',
      orLabel: 'oder das Nährwertetikett',
      scanning: 'Wird gescannt...',
      recognition: 'KI-Erkennung aktiv',
      recognized: 'Produkt Erkannt!',
      dbMatch: 'In Datenbank gefunden',
      accuracy: 'Genauigkeit',
      productName: 'Hähnchenbrust 100g',
      realValues: 'Echte Nährwerte',
      protein: 'Protein',
      carbs: 'Kohlenhydrate',
      fat: 'Fett',
      per: 'Pro',
      addToPlan: '+ Zum Plan Hinzufügen',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      title: 'Scanner d\'Ingrédients IA',
      subtitle: 'Scannez les codes-barres et étiquettes',
      database: '🍗 Base de Données 50 000+ Aliments',
      frameBarcode: 'Cadrez le Code-Barres',
      orLabel: 'ou l\'étiquette nutritionnelle',
      scanning: 'Numérisation...',
      recognition: 'Reconnaissance IA active',
      recognized: 'Produit Reconnu !',
      dbMatch: 'Trouvé dans la Base de Données',
      accuracy: 'précision',
      productName: 'Blanc de Poulet 100g',
      realValues: 'Valeurs Nutritionnelles Réelles',
      protein: 'Protéines',
      carbs: 'Glucides',
      fat: 'Lipides',
      per: 'Par',
      addToPlan: '+ Ajouter au Plan',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const scannedProduct = {
    name: tr.productName,
    brand: 'Fileni',
    barcode: '8003410252079',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
    nutrition: {
      calories: 110,
      protein: 23.1,
      carbs: 0,
      fat: 2.6,
      serving: '100g'
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        
        @keyframes pulse-scan {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
        
        .pulse-scan {
          animation: pulse-scan 1.5s ease-in-out infinite;
        }

        .scanner-content-wrapper {
          min-height: 450px;
          max-height: 450px;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100" style={{
          backdropFilter: 'blur(12px) saturate(180%)',
          background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.4) 0%, rgba(243, 244, 246, 0.3) 50%, rgba(249, 250, 241, 0.4) 100%)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tr.title}</h2>
              <p className="text-xs text-gray-600">{tr.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-indigo-200">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">{tr.database}</span>
            <Zap className="w-4 h-4 text-amber-500 ml-auto" />
          </div>
        </div>

        {/* Scanner Content - Fixed Height */}
        <div className="scanner-content-wrapper">
          {/* Scanner Area */}
          {scanStep === 0 && (
            <div className="px-6 py-8 flex-1 flex items-center justify-center">
              <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {/* Scan Line Effect */}
                <div className="absolute inset-0">
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scan-line opacity-50"></div>
                </div>
                
                {/* Scanner Corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
                
                <div className="text-center z-10">
                  <Scan className="w-16 h-16 text-gray-400 mx-auto mb-3 pulse-scan" />
                  <p className="text-sm font-semibold text-gray-700">{tr.frameBarcode}</p>
                  <p className="text-xs text-gray-500 mt-1">{tr.orLabel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanning State */}
          {scanStep === 1 && (
            <div className="px-6 py-8 flex-1 flex items-center justify-center">
              <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop"
                  alt="Scanning"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                      <div>
                        <p className="font-bold text-gray-900">{tr.scanning}</p>
                        <p className="text-xs text-gray-600">{tr.recognition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {scanStep >= 2 && (
            <div className="px-6 py-6 flex-1 overflow-y-auto">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">{tr.recognized}</p>
                    <p className="text-xs text-green-700">{tr.dbMatch} • 99% {tr.accuracy}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <img 
                  src={scannedProduct.image}
                  alt={scannedProduct.name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">{scannedProduct.name}</p>
                  <p className="text-sm text-gray-600 mb-1">{scannedProduct.brand}</p>
                  <p className="text-xs text-gray-500 font-mono">EAN: {scannedProduct.barcode}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <p className="text-sm font-bold text-gray-900 mb-3">{tr.realValues}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3 text-center border border-red-100">
                    <p className="text-2xl font-black text-red-600">{scannedProduct.nutrition.calories}</p>
                    <p className="text-xs text-gray-600">kcal</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-2xl font-black text-blue-600">{scannedProduct.nutrition.protein}g</p>
                    <p className="text-xs text-gray-600">{tr.protein}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-2xl font-black text-amber-600">{scannedProduct.nutrition.carbs}g</p>
                    <p className="text-xs text-gray-600">{tr.carbs}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
                    <p className="text-2xl font-black text-green-600">{scannedProduct.nutrition.fat}g</p>
                    <p className="text-xs text-gray-600">{tr.fat}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">{tr.per} {scannedProduct.nutrition.serving}</p>
              </div>

              <button
                disabled
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl opacity-50 cursor-not-allowed"
              >
                {tr.addToPlan}
              </button>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            {tr.preview}
          </p>
        </div>
      </Card>
    </>
  );
}