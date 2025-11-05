import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, X } from 'lucide-react';
import { ShoppingList } from '@/entities/ShoppingList';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const CATEGORY_LABELS = {
  frutta_verdura: { label: 'Frutta e Verdura', emoji: '🥗', color: 'bg-green-50 border-green-200' },
  carne_pesce: { label: 'Carne e Pesce', emoji: '🥩', color: 'bg-red-50 border-red-200' },
  latticini_uova: { label: 'Latticini e Uova', emoji: '🥛', color: 'bg-blue-50 border-blue-200' },
  cereali_pasta: { label: 'Cereali e Pasta', emoji: '🌾', color: 'bg-yellow-50 border-yellow-200' },
  legumi_frutta_secca: { label: 'Legumi e Frutta Secca', emoji: '🥜', color: 'bg-amber-50 border-amber-200' },
  condimenti_spezie: { label: 'Condimenti e Spezie', emoji: '🧂', color: 'bg-orange-50 border-orange-200' },
  bevande: { label: 'Bevande', emoji: '🥤', color: 'bg-cyan-50 border-cyan-200' },
  altro: { label: 'Altro', emoji: '🛒', color: 'bg-gray-50 border-gray-200' }
};

export default function ShoppingListModal({ user, onClose }) {
  const [shoppingList, setShoppingList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const loadShoppingList = useCallback(async () => {
    setIsLoading(true);
    try {
      const startOfWeek = getStartOfWeek();
      
      // Prima prova a caricare tutte le liste dell'utente per debug
      const allLists = await ShoppingList.filter({ user_id: user.id }, '-last_updated');
      console.log('📋 Tutte le liste trovate:', allLists);
      console.log('📅 Week start date cercata:', startOfWeek);
      
      // Poi filtra per week_start_date
      const lists = allLists.filter(list => list.week_start_date === startOfWeek);
      console.log('✅ Liste per questa settimana:', lists);
      
      if (lists.length > 0) {
        console.log('🛒 Items nella lista:', lists[0].items);
        setShoppingList(lists[0]);
      } else {
        console.warn('⚠️ Nessuna lista trovata per questa settimana');
        setShoppingList(null);
      }
    } catch (error) {
      console.error("❌ Error loading shopping list:", error);
    }
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const toggleItem = async (itemIdx) => {
    if (!shoppingList) return;
    
    const newItems = [...shoppingList.items];
    newItems[itemIdx].checked = !newItems[itemIdx].checked;
    
    try {
      await ShoppingList.update(shoppingList.id, { 
        items: newItems,
        last_updated: new Date().toISOString()
      });
      setShoppingList({ ...shoppingList, items: newItems });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const groupByCategory = () => {
    if (!shoppingList || !shoppingList.items) return {};
    
    const grouped = {};
    shoppingList.items.forEach(item => {
      const cat = item.category || 'altro';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  };

  const clearList = async () => {
    if (!shoppingList) return;
    if (!confirm('Vuoi svuotare la lista della spesa?')) return;
    
    try {
      await ShoppingList.delete(shoppingList.id);
      setShoppingList(null);
      onClose();
    } catch (error) {
      console.error("Error clearing list:", error);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento lista...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!shoppingList || !shoppingList.items || shoppingList.items.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[var(--brand-primary)]" />
              Lista della Spesa
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Nessun ingrediente in lista</p>
            <p className="text-sm text-gray-500 mt-2">Aggiungi ingredienti dai pasti della settimana usando il pulsante "+"</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const groupedItems = groupByCategory();
  const totalItems = shoppingList.items.length;
  const checkedItems = shoppingList.items.filter(i => i.checked).length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[var(--brand-primary)]" />
              Lista della Spesa
            </DialogTitle>
            <Badge variant="outline" className="text-sm">
              {checkedItems}/{totalItems} completati
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Settimana del {new Date(shoppingList.week_start_date).toLocaleDateString('it-IT')}</p>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className={`border-2 rounded-lg p-4 ${CATEGORY_LABELS[category].color}`}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_LABELS[category].emoji}</span>
                {CATEGORY_LABELS[category].label}
                <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
              </h3>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const itemIdx = shoppingList.items.findIndex(i => i.name === item.name && i.category === item.category);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-all ${
                        item.checked ? 'opacity-50 border-gray-200' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(itemIdx)}
                          className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=checked]:border-[var(--brand-primary)]"
                        />
                        <div className={item.checked ? 'line-through text-gray-500' : ''}>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.unit}
                            {item.days && item.days.length > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({item.days.map(d => d.substring(0, 3)).join(', ')})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={clearList} variant="outline" className="text-red-600 hover:bg-red-50">
            <X className="w-4 h-4 mr-2" />
            Svuota Lista
          </Button>
          <Button onClick={onClose} className="ml-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}