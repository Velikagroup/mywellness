import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Camera, Plus, Check, Apple, Milk, Egg, Fish } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Dispensa Intelligente
 * Mostra la funzionalità di catalogazione degli ingredienti in casa con AI
 */
export default function PantryPreviewDemo() {
  const { t, language } = useLanguage();
  const [view, setView] = useState('catalog'); // 'catalog' | 'scanning'

  const translations = React.useMemo(() => ({
    it: {
      title: 'Dispensa Intelligente',
      subtitle: 'Fotografa gli alimenti a casa: l\'AI crea un catalogo completo con kcal precisi e macros. Il piano alimentare si rigenera al volo con quello che hai già, riducendo sprechi e costi.',
      foods: 'Alimenti',
      categories: 'Categorie',
      accuracy: 'Accuratezza',
      scanFood: 'Scansiona Alimento',
      regeneratePlan: 'Rigenera Piano',
      scanningInProgress: 'Scansione in corso...',
      aiAnalysis: 'Analisi AI attiva',
      backToCatalog: '← Torna al Catalogo',
      optimizedPlan: 'Piano Ottimizzato',
      optimizedDesc: 'Il piano alimentare usa automaticamente gli ingredienti della tua dispensa, riducendo sprechi e costi.',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup',
      chickenBreast: 'Petto di Pollo',
      basmatiRice: 'Riso Basmati',
      broccoli: 'Broccoli',
      oliveOil: 'Olio d\'Oliva',
      eggs: 'Uova',
      skimMilk: 'Latte Scremato',
      pieces: 'pz',
      categoryProtein: 'Proteine',
      categoryCarbs: 'Carboidrati',
      categoryVegetables: 'Verdure',
      categoryFats: 'Grassi',
      categoryDairy: 'Latticini'
    },
    en: {
      title: 'Smart Pantry',
      subtitle: 'Photograph food at home: AI creates a complete catalog with precise kcal and macros. The meal plan regenerates on the fly with what you already have, reducing waste and costs.',
      foods: 'Foods',
      categories: 'Categories',
      accuracy: 'Accuracy',
      scanFood: 'Scan Food',
      regeneratePlan: 'Regenerate Plan',
      scanningInProgress: 'Scanning in progress...',
      aiAnalysis: 'AI analysis active',
      backToCatalog: '← Back to Catalog',
      optimizedPlan: 'Optimized Plan',
      optimizedDesc: 'The meal plan automatically uses ingredients from your pantry, reducing waste and costs.',
      preview: 'Interface preview • Features available after signup',
      chickenBreast: 'Chicken Breast',
      basmatiRice: 'Basmati Rice',
      broccoli: 'Broccoli',
      oliveOil: 'Olive Oil',
      eggs: 'Eggs',
      skimMilk: 'Skim Milk',
      pieces: 'pcs',
      categoryProtein: 'Protein',
      categoryCarbs: 'Carbs',
      categoryVegetables: 'Vegetables',
      categoryFats: 'Fats',
      categoryDairy: 'Dairy'
    },
    es: {
      title: 'Despensa Inteligente',
      subtitle: 'Fotografía alimentos en casa: la IA crea un catálogo completo con kcal precisas y macros. El plan alimentario se regenera al vuelo con lo que ya tienes, reduciendo desperdicios y costos.',
      foods: 'Alimentos',
      categories: 'Categorías',
      accuracy: 'Precisión',
      scanFood: 'Escanear Alimento',
      regeneratePlan: 'Regenerar Plan',
      scanningInProgress: 'Escaneando...',
      aiAnalysis: 'Análisis IA activo',
      backToCatalog: '← Volver al Catálogo',
      optimizedPlan: 'Plan Optimizado',
      optimizedDesc: 'El plan alimentario usa automáticamente los ingredientes de tu despensa, reduciendo desperdicios y costos.',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro',
      chickenBreast: 'Pechuga de Pollo',
      basmatiRice: 'Arroz Basmati',
      broccoli: 'Brócoli',
      oliveOil: 'Aceite de Oliva',
      eggs: 'Huevos',
      skimMilk: 'Leche Desnatada',
      pieces: 'pzs',
      categoryProtein: 'Proteínas',
      categoryCarbs: 'Carbohidratos',
      categoryVegetables: 'Verduras',
      categoryFats: 'Grasas',
      categoryDairy: 'Lácteos'
    },
    pt: {
      title: 'Despensa Inteligente',
      subtitle: 'Fotografe alimentos em casa: a IA cria um catálogo completo com kcal precisas e macros. O plano alimentar se regenera na hora com o que você já tem, reduzindo desperdícios e custos.',
      foods: 'Alimentos',
      categories: 'Categorias',
      accuracy: 'Precisão',
      scanFood: 'Escanear Alimento',
      regeneratePlan: 'Regenerar Plano',
      scanningInProgress: 'Digitalizando...',
      aiAnalysis: 'Análise IA ativa',
      backToCatalog: '← Voltar ao Catálogo',
      optimizedPlan: 'Plano Otimizado',
      optimizedDesc: 'O plano alimentar usa automaticamente os ingredientes da sua despensa, reduzindo desperdícios e custos.',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro',
      chickenBreast: 'Peito de Frango',
      basmatiRice: 'Arroz Basmati',
      broccoli: 'Brócolis',
      oliveOil: 'Azeite de Oliva',
      eggs: 'Ovos',
      skimMilk: 'Leite Desnatado',
      pieces: 'unid',
      categoryProtein: 'Proteínas',
      categoryCarbs: 'Carboidratos',
      categoryVegetables: 'Vegetais',
      categoryFats: 'Gorduras',
      categoryDairy: 'Laticínios'
    },
    de: {
      title: 'Intelligente Vorratskammer',
      subtitle: 'Fotografieren Sie Lebensmittel zu Hause: KI erstellt einen vollständigen Katalog mit präzisen kcal und Makros. Der Ernährungsplan regeneriert sich vorrangig mit dem, was Sie bereits haben, reduziert Verschwendung und Kosten.',
      foods: 'Lebensmittel',
      categories: 'Kategorien',
      accuracy: 'Genauigkeit',
      scanFood: 'Lebensmittel Scannen',
      regeneratePlan: 'Plan Regenerieren',
      scanningInProgress: 'Wird gescannt...',
      aiAnalysis: 'KI-Analyse aktiv',
      backToCatalog: '← Zurück zum Katalog',
      optimizedPlan: 'Optimierter Plan',
      optimizedDesc: 'Der Ernährungsplan verwendet automatisch Zutaten aus Ihrer Vorratskammer und reduziert Verschwendung und Kosten.',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar',
      chickenBreast: 'Hähnchenbrust',
      basmatiRice: 'Basmatireis',
      broccoli: 'Brokkoli',
      oliveOil: 'Olivenöl',
      eggs: 'Eier',
      skimMilk: 'Magermilch',
      pieces: 'Stk',
      categoryProtein: 'Protein',
      categoryCarbs: 'Kohlenhydrate',
      categoryVegetables: 'Gemüse',
      categoryFats: 'Fette',
      categoryDairy: 'Molkereiprodukte'
    },
    fr: {
      title: 'Garde-Manger Intelligent',
      subtitle: 'Photographiez les aliments à la maison : l\'IA crée un catalogue complet avec kcal précises et macros. Le plan alimentaire se régénère à la volée avec ce que vous avez déjà, réduisant le gaspillage et les coûts.',
      foods: 'Aliments',
      categories: 'Catégories',
      accuracy: 'Précision',
      scanFood: 'Scanner Aliment',
      regeneratePlan: 'Régénérer le Plan',
      scanningInProgress: 'Numérisation...',
      aiAnalysis: 'Analyse IA active',
      backToCatalog: '← Retour au Catalogue',
      optimizedPlan: 'Plan Optimisé',
      optimizedDesc: 'Le plan alimentaire utilise automatiquement les ingrédients de votre garde-manger, réduisant le gaspillage et les coûts.',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription',
      chickenBreast: 'Blanc de Poulet',
      basmatiRice: 'Riz Basmati',
      broccoli: 'Brocoli',
      oliveOil: 'Huile d\'Olive',
      eggs: 'Œufs',
      skimMilk: 'Lait Écrémé',
      pieces: 'pcs',
      categoryProtein: 'Protéines',
      categoryCarbs: 'Glucides',
      categoryVegetables: 'Légumes',
      categoryFats: 'Lipides',
      categoryDairy: 'Produits Laitiers'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const pantryItems = [
    {
      name: tr.chickenBreast,
      quantity: '500g',
      icon: '🍗',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      category: tr.categoryProtein
    },
    {
      name: tr.basmatiRice,
      quantity: '1kg',
      icon: '🍚',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      category: tr.categoryCarbs
    },
    {
      name: tr.broccoli,
      quantity: '300g',
      icon: '🥦',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      category: tr.categoryVegetables
    },
    {
      name: tr.oliveOil,
      quantity: '750ml',
      icon: '🫒',
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      category: tr.categoryFats
    },
    {
      name: tr.eggs,
      quantity: `6 ${tr.pieces}`,
      icon: '🥚',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      category: tr.categoryProtein
    },
    {
      name: tr.skimMilk,
      quantity: '1L',
      icon: '🥛',
      calories: 34,
      protein: 3.4,
      carbs: 5,
      fat: 0.1,
      category: tr.categoryDairy
    }
  ];

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

        @keyframes scanning {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(10px); opacity: 1; }
        }

        .scanning-line {
          animation: scanning 2s ease-in-out infinite;
        }
      `}</style>

      <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50 pb-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            {tr.title}
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center sm:text-left">
            {tr.subtitle}
          </p>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {view === 'catalog' && (
            <>
              {/* Header con statistiche */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-center border border-blue-200/50">
                  <p className="text-2xl font-black text-blue-700">{pantryItems.length}</p>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">{tr.foods}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-200/50">
                  <p className="text-2xl font-black text-green-700">4</p>
                  <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">{tr.categories}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center border border-purple-200/50">
                  <p className="text-2xl font-black text-purple-700">98%</p>
                  <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wide">{tr.accuracy}</p>
                </div>
              </div>

              {/* Lista ingredienti */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pantryItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200/50 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.quantity} • {item.category}</p>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <div className="flex-1 bg-gray-50 rounded px-2 py-1">
                        <span className="text-gray-500">Kcal:</span>
                        <span className="ml-1 font-bold text-gray-900">{item.calories}</span>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded px-2 py-1">
                        <span className="text-blue-600">P:</span>
                        <span className="ml-1 font-bold text-blue-700">{item.protein}g</span>
                      </div>
                      <div className="flex-1 bg-amber-50 rounded px-2 py-1">
                        <span className="text-amber-600">C:</span>
                        <span className="ml-1 font-bold text-amber-700">{item.carbs}g</span>
                      </div>
                      <div className="flex-1 bg-orange-50 rounded px-2 py-1">
                        <span className="text-orange-600">G:</span>
                        <span className="ml-1 font-bold text-orange-700">{item.fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200/50">
                <button
                  onClick={() => setView('scanning')}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Camera className="w-4 h-4" />
                  {tr.scanFood}
                </button>
                <button
                  className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Plus className="w-4 h-4" />
                  {tr.regeneratePlan}
                </button>
              </div>
            </>
          )}

          {view === 'scanning' && (
            <div className="text-center py-8">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-indigo-400" />
                </div>
                <div className="absolute inset-0 scanning-line border-t-2 border-indigo-600"></div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{tr.scanningInProgress}</p>
              <p className="text-xs text-gray-500">{tr.aiAnalysis}</p>
              <button
                onClick={() => setView('catalog')}
                className="mt-6 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {tr.backToCatalog}
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200/50">
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 mb-1">
                  💡 {tr.optimizedPlan}
                </p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  {tr.optimizedDesc}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="px-5 pb-4">
          <div className="bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-200/30">
            <p className="text-[10px] text-gray-400 text-center italic">
              {tr.preview}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}