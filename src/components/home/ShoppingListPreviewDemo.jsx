import React from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ShoppingListPreviewDemo() {
  const { t, language } = useLanguage();
  
  const translations = React.useMemo(() => ({
    it: { title: 'Lista della Spesa', subtitle: 'Generata dall\'AI per questa settimana', completion: 'Completamento', items: 'articoli', fruitVeg: 'Frutta e Verdura', meat: 'Carne e Pesce', dairy: 'Latticini e Uova', grains: 'Cereali e Pasta', condiments: 'Condimenti', tomatoes: 'Pomodori', spinach: 'Spinaci freschi', bananas: 'Banane', chickenBreast: 'Petto di pollo', salmon: 'Salmone fresco', greekYogurt: 'Yogurt greco', eggs: 'Uova', mozzarella: 'Mozzarella', brownRice: 'Riso integrale', wholePasta: 'Pasta integrale', oliveOil: 'Olio EVO', pinkSalt: 'Sale rosa', unit: 'unità', preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup' },
    en: { title: 'Shopping List', subtitle: 'AI-generated for this week', completion: 'Completion', items: 'items', fruitVeg: 'Fruits and Vegetables', meat: 'Meat and Fish', dairy: 'Dairy and Eggs', grains: 'Grains and Pasta', condiments: 'Condiments', tomatoes: 'Tomatoes', spinach: 'Fresh spinach', bananas: 'Bananas', chickenBreast: 'Chicken breast', salmon: 'Fresh salmon', greekYogurt: 'Greek yogurt', eggs: 'Eggs', mozzarella: 'Mozzarella', brownRice: 'Brown rice', wholePasta: 'Whole wheat pasta', oliveOil: 'Olive oil', pinkSalt: 'Pink salt', unit: 'units', preview: 'Interface preview • Features available after signup' },
    es: { title: 'Lista de Compras', subtitle: 'Generada por IA para esta semana', completion: 'Completado', items: 'artículos', fruitVeg: 'Frutas y Verduras', meat: 'Carne y Pescado', dairy: 'Lácteos y Huevos', grains: 'Cereales y Pasta', condiments: 'Condimentos', tomatoes: 'Tomates', spinach: 'Espinacas frescas', bananas: 'Plátanos', chickenBreast: 'Pechuga de pollo', salmon: 'Salmón fresco', greekYogurt: 'Yogur griego', eggs: 'Huevos', mozzarella: 'Mozzarella', brownRice: 'Arroz integral', wholePasta: 'Pasta integral', oliveOil: 'Aceite de oliva', pinkSalt: 'Sal rosa', unit: 'unidades', preview: 'Vista previa de interfaz • Funciones disponibles después del registro' },
    pt: { title: 'Lista de Compras', subtitle: 'Gerada pela IA para esta semana', completion: 'Conclusão', items: 'itens', fruitVeg: 'Frutas e Vegetais', meat: 'Carne e Peixe', dairy: 'Laticínios e Ovos', grains: 'Cereais e Massa', condiments: 'Condimentos', tomatoes: 'Tomates', spinach: 'Espinafre fresco', bananas: 'Bananas', chickenBreast: 'Peito de frango', salmon: 'Salmão fresco', greekYogurt: 'Iogurte grego', eggs: 'Ovos', mozzarella: 'Mozzarella', brownRice: 'Arroz integral', wholePasta: 'Massa integral', oliveOil: 'Azeite de oliva', pinkSalt: 'Sal rosa', unit: 'unidades', preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro' },
    de: { title: 'Einkaufsliste', subtitle: 'Von KI für diese Woche generiert', completion: 'Abschluss', items: 'Artikel', fruitVeg: 'Obst und Gemüse', meat: 'Fleisch und Fisch', dairy: 'Milchprodukte und Eier', grains: 'Getreide und Nudeln', condiments: 'Gewürze', tomatoes: 'Tomaten', spinach: 'Frischer Spinat', bananas: 'Bananen', chickenBreast: 'Hähnchenbrust', salmon: 'Frischer Lachs', greekYogurt: 'Griechischer Joghurt', eggs: 'Eier', mozzarella: 'Mozzarella', brownRice: 'Vollkornreis', wholePasta: 'Vollkornnudeln', oliveOil: 'Olivenöl', pinkSalt: 'Rosa Salz', unit: 'Stück', preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar' },
    fr: { title: 'Liste de Courses', subtitle: 'Générée par IA pour cette semaine', completion: 'Achèvement', items: 'articles', fruitVeg: 'Fruits et Légumes', meat: 'Viande et Poisson', dairy: 'Produits Laitiers et Œufs', grains: 'Céréales et Pâtes', condiments: 'Condiments', tomatoes: 'Tomates', spinach: 'Épinards frais', bananas: 'Bananes', chickenBreast: 'Blanc de poulet', salmon: 'Saumon frais', greekYogurt: 'Yaourt grec', eggs: 'Œufs', mozzarella: 'Mozzarella', brownRice: 'Riz complet', wholePasta: 'Pâtes complètes', oliveOil: 'Huile d\'olive', pinkSalt: 'Sel rose', unit: 'unités', preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription' }
  }), []);

  const tr = translations[language] || translations.it;
  
  const categories = [
    {
      name: tr.fruitVeg,
      icon: '🥬',
      items: [
        { name: tr.tomatoes, quantity: '500g', checked: true },
        { name: tr.spinach, quantity: '300g', checked: false },
        { name: tr.bananas, quantity: `6 ${tr.unit}`, checked: true }
      ]
    },
    {
      name: tr.meat,
      icon: '🥩',
      items: [
        { name: tr.chickenBreast, quantity: '800g', checked: false },
        { name: tr.salmon, quantity: '400g', checked: false }
      ]
    },
    {
      name: tr.dairy,
      icon: '🥛',
      items: [
        { name: tr.greekYogurt, quantity: '1kg', checked: true },
        { name: tr.eggs, quantity: `12 ${tr.unit}`, checked: false },
        { name: tr.mozzarella, quantity: '250g', checked: false }
      ]
    },
    {
      name: tr.grains,
      icon: '🍝',
      items: [
        { name: tr.brownRice, quantity: '500g', checked: false },
        { name: tr.wholePasta, quantity: '500g', checked: true }
      ]
    },
    {
      name: tr.condiments,
      icon: '🧂',
      items: [
        { name: tr.oliveOil, quantity: '1L', checked: true },
        { name: tr.pinkSalt, quantity: '250g', checked: true }
      ]
    }
  ];

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = categories.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.checked).length, 0
  );

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

        @keyframes check-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .check-animation {
          animation: check-pulse 0.3s ease-out;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{tr.title}</h2>
                <p className="text-xs text-gray-600">{tr.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">{tr.completion}</span>
              <span className="font-bold text-teal-600">{checkedItems}/{totalItems} {tr.items}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(checkedItems / totalItems) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="px-4 py-4 space-y-4 max-h-[450px] overflow-y-auto">
          {categories.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {category.items.filter(i => i.checked).length}/{category.items.length}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="p-2 space-y-1">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      item.checked 
                        ? 'bg-green-50/50' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.checked 
                          ? 'bg-teal-500 border-teal-500 check-animation' 
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium transition-all ${
                        item.checked 
                          ? 'text-gray-400 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {item.name}
                      </p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${
                      item.checked 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            {tr.preview}
          </p>
        </div>
      </Card>
    </>
  );
}