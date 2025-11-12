import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

const EQUIPMENT_CATEGORIES = [
  {
    id: 'corpo_libero',
    label: '💪 Corpo Libero',
    description: 'Nessuna attrezzatura, solo il tuo corpo',
    items: ['corpo_libero']
  },
  {
    id: 'casa_base',
    label: '🏠 Casa - Base',
    description: 'Attrezzatura minima per casa',
    items: ['tappetino', 'elastici', 'panca', 'sbarra_trazioni']
  },
  {
    id: 'casa_completa',
    label: '🏠 Casa - Completa',
    description: 'Home gym completo',
    items: ['manubri', 'kettlebell', 'panca', 'sbarra', 'trx', 'elastici', 'corda', 'medicine_ball', 'ab_wheel']
  },
  {
    id: 'palestra_base',
    label: '🏋️ Palestra - Base',
    description: 'Pesi liberi e macchine essenziali',
    items: ['bilanciere', 'manubri', 'panca', 'sbarra', 'parallele', 'lat_machine', 'cable_machine', 'leg_press', 'chest_press']
  },
  {
    id: 'palestra_completa',
    label: '🏋️ Palestra - Completa',
    description: 'Accesso a tutte le attrezzature',
    items: [
      'bilanciere', 'manubri', 'kettlebell', 'panca', 'sbarra', 'parallele',
      'lat_machine', 'cable_machine', 'leg_press', 'leg_extension', 'leg_curl',
      'chest_press', 'pec_deck', 'shoulder_press_machine', 'smith_machine',
      'hack_squat', 'calf_machine', 'abductor_machine', 'adductor_machine',
      'hyperextension_bench', 'preacher_bench', 'ghd_machine', 'trap_bar',
      'battle_ropes', 'sled', 'rowing_machine', 'assault_bike', 'trx',
      'medicine_ball', 'box', 'corda', 'tapis_roulant', 'cyclette', 'ellittica'
    ]
  },
  {
    id: 'crossfit',
    label: '⚡ CrossFit / Functional',
    description: 'Box CrossFit con tutte le attrezzature funzionali',
    items: [
      'bilanciere', 'bumper_plates', 'manubri', 'kettlebell', 'panca', 'sbarra',
      'parallele', 'anelli', 'box', 'battle_ropes', 'sled', 'corda', 'rowing_machine',
      'assault_bike', 'wall_ball', 'medicine_ball', 'plyo_box', 'ghd_machine'
    ]
  },
  {
    id: 'outdoor',
    label: '🌳 All\'Aperto',
    description: 'Allenamento outdoor senza attrezzature',
    items: ['corpo_libero', 'area_aperta', 'panchina_parco', 'gradini']
  },
  {
    id: 'personalizzato',
    label: '⚙️ Personalizzato',
    description: 'Seleziona singolarmente le attrezzature',
    items: [] // Permetterà selezione custom sotto
  }
];

const ALL_EQUIPMENT = [
  // Corpo Libero
  { id: 'corpo_libero', label: '💪 Corpo Libero', category: 'base' },
  
  // Pesi Liberi
  { id: 'bilanciere', label: '🏋️ Bilanciere', category: 'pesi_liberi' },
  { id: 'manubri', label: '🏋️ Manubri', category: 'pesi_liberi' },
  { id: 'kettlebell', label: '🏋️ Kettlebell', category: 'pesi_liberi' },
  { id: 'trap_bar', label: '🏋️ Trap Bar (Esagonale)', category: 'pesi_liberi' },
  
  // Supporti e Strutture
  { id: 'panca', label: '🪑 Panca Piana', category: 'supporti' },
  { id: 'panca_inclinata', label: '🪑 Panca Inclinata', category: 'supporti' },
  { id: 'panca_declinata', label: '🪑 Panca Declinata', category: 'supporti' },
  { id: 'sbarra', label: '🏗️ Sbarra per Trazioni', category: 'supporti' },
  { id: 'parallele', label: '🏗️ Parallele per Dip', category: 'supporti' },
  { id: 'rack_squat', label: '🏗️ Rack per Squat', category: 'supporti' },
  
  // Macchine Gambe
  { id: 'leg_press', label: '🦵 Leg Press', category: 'macchine_gambe' },
  { id: 'leg_extension', label: '🦵 Leg Extension', category: 'macchine_gambe' },
  { id: 'leg_curl', label: '🦵 Leg Curl', category: 'macchine_gambe' },
  { id: 'hack_squat', label: '🦵 Hack Squat Machine', category: 'macchine_gambe' },
  { id: 'calf_machine', label: '🦵 Calf Machine', category: 'macchine_gambe' },
  { id: 'abductor_machine', label: '🦵 Abductor Machine', category: 'macchine_gambe' },
  { id: 'adductor_machine', label: '🦵 Adductor Machine', category: 'macchine_gambe' },
  
  // Macchine Upper Body
  { id: 'chest_press', label: '💪 Chest Press Machine', category: 'macchine_upper' },
  { id: 'pec_deck', label: '💪 Pec Deck / Fly Machine', category: 'macchine_upper' },
  { id: 'lat_machine', label: '💪 Lat Machine', category: 'macchine_upper' },
  { id: 'shoulder_press_machine', label: '💪 Shoulder Press Machine', category: 'macchine_upper' },
  { id: 'cable_machine', label: '💪 Cable Machine / Cavi', category: 'macchine_upper' },
  { id: 'smith_machine', label: '💪 Smith Machine', category: 'macchine_upper' },
  
  // Core e Stabilizzazione
  { id: 'hyperextension_bench', label: '🧘 Hyperextension Bench', category: 'core' },
  { id: 'ghd_machine', label: '🧘 GHD Machine', category: 'core' },
  { id: 'ab_wheel', label: '🧘 Ab Wheel', category: 'core' },
  { id: 'medicine_ball', label: '⚽ Medicine Ball', category: 'core' },
  
  // Functional / CrossFit
  { id: 'battle_ropes', label: '🪢 Battle Ropes', category: 'functional' },
  { id: 'sled', label: '🛷 Sled (Slitta)', category: 'functional' },
  { id: 'box', label: '📦 Plyo Box', category: 'functional' },
  { id: 'anelli', label: '💍 Anelli Ginnastica', category: 'functional' },
  { id: 'wall_ball', label: '⚽ Wall Ball Target', category: 'functional' },
  { id: 'bumper_plates', label: '🏋️ Bumper Plates (Gomma)', category: 'functional' },
  
  // Cardio
  { id: 'tapis_roulant', label: '🏃 Tapis Roulant', category: 'cardio' },
  { id: 'rowing_machine', label: '🚣 Rowing Machine', category: 'cardio' },
  { id: 'assault_bike', label: '🚴 Assault Bike', category: 'cardio' },
  { id: 'cyclette', label: '🚴 Cyclette', category: 'cardio' },
  { id: 'ellittica', label: '🚴 Ellittica', category: 'cardio' },
  { id: 'corda', label: '🪢 Corda per Saltare', category: 'cardio' },
  
  // Accessori
  { id: 'trx', label: '🎽 TRX / Suspension Trainer', category: 'accessori' },
  { id: 'elastici', label: '🎗️ Elastici / Bande Resistenza', category: 'accessori' },
  { id: 'preacher_bench', label: '🪑 Panca Scott (Preacher)', category: 'accessori' },
  { id: 'tappetino', label: '🧘 Tappetino Yoga', category: 'accessori' },
  
  // Outdoor
  { id: 'area_aperta', label: '🌳 Area Aperta (Parco/Campo)', category: 'outdoor' },
  { id: 'panchina_parco', label: '🪑 Panchina Parco', category: 'outdoor' },
  { id: 'gradini', label: '🪜 Gradini / Scale', category: 'outdoor' }
];

export default function EquipmentStep({ data, onDataChange, nextStep }) {
  const [selectedCategory, setSelectedCategory] = useState(
    data.equipment_category || null
  );
  const [customEquipment, setCustomEquipment] = useState(
    data.equipment || []
  );

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    
    if (category.id === 'personalizzato') {
      // Non auto-avanza per personalizzato
      onDataChange({
        equipment_category: category.id,
        equipment: customEquipment
      });
    } else {
      // Per categorie predefinite, auto-avanza
      onDataChange({
        equipment_category: category.id,
        equipment: category.items
      });
      
      if (nextStep) {
        setTimeout(() => nextStep(), 300);
      }
    }
  };

  const handleCustomToggle = (equipmentId) => {
    const newSelection = customEquipment.includes(equipmentId)
      ? customEquipment.filter(id => id !== equipmentId)
      : [...customEquipment, equipmentId];
    
    setCustomEquipment(newSelection);
    onDataChange({
      equipment_category: 'personalizzato',
      equipment: newSelection
    });
  };

  const groupedEquipment = ALL_EQUIPMENT.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    base: '💪 Base',
    pesi_liberi: '🏋️ Pesi Liberi',
    supporti: '🏗️ Supporti',
    macchine_gambe: '🦵 Macchine Gambe',
    macchine_upper: '💪 Macchine Upper Body',
    core: '🧘 Core & Stabilità',
    functional: '⚡ Functional Training',
    cardio: '🏃 Cardio',
    accessori: '🎽 Accessori',
    outdoor: '🌳 Outdoor'
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          A quali attrezzature hai accesso?
        </h3>
        <p className="text-sm text-gray-600">
          Seleziona una categoria rapida o personalizza la selezione
        </p>
      </div>

      {/* Categorie Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EQUIPMENT_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedCategory === category.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md'
                : 'border-gray-200 hover:border-[var(--brand-primary)]/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {selectedCategory === category.id ? (
                  <CheckCircle className="w-6 h-6 text-[var(--brand-primary)]" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg mb-1">{category.label}</p>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selezione Personalizzata */}
      {selectedCategory === 'personalizzato' && (
        <div className="space-y-4 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
          <h4 className="font-bold text-gray-900 text-lg mb-4">
            Seleziona singolarmente le attrezzature:
          </h4>
          
          {Object.entries(groupedEquipment).map(([categoryKey, items]) => (
            <div key={categoryKey} className="space-y-2">
              <h5 className="font-semibold text-gray-700 text-sm">
                {categoryLabels[categoryKey]}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCustomToggle(item.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                      customEquipment.includes(item.id)
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'border-gray-200 hover:border-[var(--brand-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {customEquipment.includes(item.id) ? (
                        <CheckCircle className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-800">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riepilogo Selezione */}
      {selectedCategory && selectedCategory !== 'personalizzato' && (
        <div className="bg-[var(--brand-primary-light)] p-4 rounded-xl border-2 border-[var(--brand-primary)]/30">
          <p className="text-sm text-[var(--brand-primary-dark-text)] font-semibold">
            ✅ Categoria selezionata: {EQUIPMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </p>
        </div>
      )}

      {selectedCategory === 'personalizzato' && customEquipment.length > 0 && (
        <div className="bg-[var(--brand-primary-light)] p-4 rounded-xl border-2 border-[var(--brand-primary)]/30">
          <p className="text-sm text-[var(--brand-primary-dark-text)] font-semibold mb-2">
            ✅ {customEquipment.length} attrezzature selezionate
          </p>
          <div className="flex flex-wrap gap-2">
            {customEquipment.map(eqId => {
              const equipment = ALL_EQUIPMENT.find(e => e.id === eqId);
              return equipment ? (
                <span key={eqId} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-[var(--brand-primary)]/20">
                  {equipment.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}