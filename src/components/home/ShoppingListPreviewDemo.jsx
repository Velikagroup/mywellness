import React from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ShoppingListPreviewDemo() {
  const { t } = useLanguage();
  const categories = [
    {
      name: t('home.shoppingCategoryFruitVeg'),
      icon: '🥬',
      items: [
        { name: t('home.shoppingItemTomatoes'), quantity: '500g', checked: true },
        { name: t('home.shoppingItemSpinach'), quantity: '300g', checked: false },
        { name: t('home.shoppingItemBananas'), quantity: `6 ${t('home.shoppingUnit')}`, checked: true }
      ]
    },
    {
      name: t('home.shoppingCategoryMeat'),
      icon: '🥩',
      items: [
        { name: t('home.shoppingItemChickenBreast'), quantity: '800g', checked: false },
        { name: t('home.shoppingItemSalmon'), quantity: '400g', checked: false }
      ]
    },
    {
      name: t('home.shoppingCategoryDairy'),
      icon: '🥛',
      items: [
        { name: t('home.shoppingItemGreekYogurt'), quantity: '1kg', checked: true },
        { name: t('home.shoppingItemEggs'), quantity: `12 ${t('home.shoppingUnit')}`, checked: false },
        { name: t('home.shoppingItemMozzarella'), quantity: '250g', checked: false }
      ]
    },
    {
      name: t('home.shoppingCategoryGrains'),
      icon: '🍝',
      items: [
        { name: t('home.shoppingItemBrownRice'), quantity: '500g', checked: false },
        { name: t('home.shoppingItemWholePasta'), quantity: '500g', checked: true }
      ]
    },
    {
      name: t('home.shoppingCategoryCondiments'),
      icon: '🧂',
      items: [
        { name: t('home.shoppingItemOliveOil'), quantity: '1L', checked: true },
        { name: t('home.shoppingItemPinkSalt'), quantity: '250g', checked: true }
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
                <h2 className="text-xl font-bold text-gray-900">{t('home.shoppingListTitle')}</h2>
                <p className="text-xs text-gray-600">{t('home.shoppingListSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">{t('home.shoppingListCompletion')}</span>
              <span className="font-bold text-teal-600">{checkedItems}/{totalItems} {t('home.shoppingListItems')}</span>
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
            {t('home.quizDemoPreview')}
          </p>
        </div>
      </Card>
    </>
  );
}