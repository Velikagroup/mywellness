import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, ArrowUp, ArrowDown, Watch, Crown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { hasFeatureAccess } from '../utils/subscriptionPlans';
import UpgradeModal from '../meals/UpgradeModal';

export default function CalorieBalanceChart({ user }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [healthKitData, setHealthKitData] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const calculateBMR = (userData) => {
    if (!userData?.gender || !userData?.current_weight || !userData?.height) return 0;
    
    // Calcola età dalla data di nascita
    let age = 30; // default
    if (userData.birthdate) {
      const birthDate = new Date(userData.birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Mifflin-St Jeor formula
    const weight = userData.current_weight;
    const height = userData.height;
    
    if (userData.gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateNEAT = (userData) => {
    const bmr = calculateBMR(userData);
    const activityMultipliers = {
      sedentary: 0.2,
      light: 0.375,
      moderate: 0.55,
      active: 0.725,
      very_active: 0.9
    };
    
    const multiplier = activityMultipliers[userData?.activity_level] || 0.375;
    return bmr * multiplier;
  };

  const loadData = async () => {
    if (!user?.id) {
      console.log('⚠️ CalorieBalanceChart: No user ID');
      return;
    }
    
    console.log('🔄 CalorieBalanceChart: Loading data for user', user.id);
    console.log('👤 User data:', { 
      gender: user.gender, 
      weight: user.current_weight, 
      height: user.height,
      birthdate: user.birthdate,
      activity: user.activity_level 
    });
    
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

      console.log('📅 Today:', today, 'Day:', dayOfWeek);

      // Carica piano nutrizionale di oggi
      const mealPlans = await base44.entities.MealPlan.filter({
        user_id: user.id,
        day_of_week: dayOfWeek
      });
      console.log('🍽️ Meal plans loaded:', mealPlans.length);

      // Carica pasti loggati di oggi
      const mealLogs = await base44.entities.MealLog.filter({
        user_id: user.id,
        date: today
      });
      console.log('📊 Meal logs loaded:', mealLogs.length);

      // Carica dati HealthKit per oggi
      const healthKitSync = await base44.entities.HealthKitSync.filter({
        user_id: user.id,
        date: today
      });
      console.log('🍎 HealthKit data loaded:', healthKitSync.length);
      
      if (healthKitSync.length > 0) {
        setHealthKitData(healthKitSync[0]);
        setDeviceConnected(true);
        console.log('✅ Device connected with HealthKit data');
      } else if (user.healthkit_connected) {
        setDeviceConnected(true);
        console.log('✅ Device connected (no data for today yet)');
      }

      // Calcola calorie dal piano
      const plannedCalories = mealPlans.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);

      // Calcola calorie consumate: per ogni pasto pianificato, usa il log se esiste, altrimenti usa il piano
      let consumedCalories = 0;
      const loggedMealTypes = new Set(mealLogs.map(log => log.meal_type));
      
      // Crea array di pasti con info se sono stati loggati o meno
      const mealSegments = mealPlans
        .sort((a, b) => {
          const order = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
          return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
        })
        .map(meal => {
          const isLogged = loggedMealTypes.has(meal.meal_type);
          const calories = isLogged 
            ? mealLogs.find(log => log.meal_type === meal.meal_type)?.actual_calories || 0
            : meal.total_calories || 0;
          
          consumedCalories += calories;
          
          return {
            meal_type: meal.meal_type,
            calories,
            isLogged
          };
        });

      // Calcola metabolismo basale e NEAT
      const bmr = calculateBMR(user);
      
      // Usa dati HealthKit se disponibili, altrimenti calcolo automatico
      let neat = calculateNEAT(user);
      if (healthKitSync.length > 0 && healthKitSync[0].active_energy_burned_kcal) {
        neat = healthKitSync[0].active_energy_burned_kcal;
        console.log('🍎 Using HealthKit NEAT:', neat);
      } else {
        console.log('📊 Using calculated NEAT:', neat);
      }
      
      const totalBurned = bmr + neat;

      console.log('💪 BMR:', bmr, 'NEAT:', neat, 'Total burned:', totalBurned);
      console.log('🍴 Planned:', plannedCalories, 'Consumed:', consumedCalories);

      // Calcola bilancio
      const balance = consumedCalories - totalBurned;

      // Determina se obiettivo è dimagrimento o aumento massa
      const isWeightLoss = user.target_weight < user.current_weight;

      setData({
        plannedCalories: Math.round(plannedCalories),
        consumedCalories: Math.round(consumedCalories),
        mealSegments,
        bmr: Math.round(bmr),
        neat: Math.round(neat),
        totalBurned: Math.round(totalBurned),
        balance: Math.round(balance),
        isWeightLoss
      });

      console.log('✅ CalorieBalanceChart: Data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading calorie data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="water-glass-effect border-gray-200/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="water-glass-effect border-gray-200/30">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-8">
            Dati non disponibili
          </div>
        </CardContent>
      </Card>
    );
  }

  const consumedPercent = Math.min((data.consumedCalories / data.plannedCalories) * 100, 100);
  const burnedPercent = 100;

  // Logica colori basata su obiettivo peso
  const consumedColor = data.isWeightLoss ? 'green' : 'red';
  const burnedColor = data.isWeightLoss ? 'green' : 'red';
  
  // Deficit: negativo = buono per dimagrimento, positivo = buono per aumento
  const isBalanceGood = data.isWeightLoss 
    ? data.balance < 0  // Dimagrimento: deficit è buono
    : data.balance > 0; // Aumento massa: surplus è buono

  return (
    <>
    <Card className="water-glass-effect border-gray-200/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t('dashboard.calorieBalanceToday')}
          </CardTitle>
          {hasFeatureAccess(user?.subscription_plan, 'smartwatch_sync') ? (
            deviceConnected ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">Dispositivo connesso</span>
                </div>
                {healthKitData?.last_sync_at && (
                  <span className="text-xs text-gray-500">
                    {new Date(healthKitData.last_sync_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowDeviceModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#26847F]/10 hover:bg-[#26847F]/20 text-[#26847F] rounded-md transition-colors font-medium"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>{t('dashboard.connectDevice')}</span>
              </button>
            )
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-300/50 text-gray-500 rounded-md cursor-pointer font-medium"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>{t('dashboard.connectDevice')}</span>
              </button>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full hover:bg-purple-600 transition-all shadow-md z-10"
              >
                <span>Premium</span>
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DEFICIT/SURPLUS - GROSSO E IN EVIDENZA */}
        <div className={`rounded-xl p-6 text-center border-2 ${
          isBalanceGood
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
        }`}>
          <p className="text-sm font-medium text-gray-600 mb-2">{t('dashboard.dailyBalance').toUpperCase()}</p>
          <div className="flex items-center justify-center gap-3">
            {isBalanceGood ? (
              <ArrowDown className="w-8 h-8 text-green-600" />
            ) : (
              <ArrowUp className="w-8 h-8 text-red-600" />
            )}
            <p className={`text-5xl font-bold ${isBalanceGood ? 'text-green-600' : 'text-red-600'}`}>
              {data.balance > 0 ? '+' : ''}{data.balance}
            </p>
            <span className="text-2xl font-semibold text-gray-600">kcal</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {data.isWeightLoss ? (
              data.balance < 0 
                ? t('dashboard.deficitPerfect').replace('{amount}', Math.abs(data.balance))
                : data.balance === 0
                ? t('dashboard.maintenance')
                : t('dashboard.surplusSlowsLoss').replace('{amount}', data.balance)
            ) : (
              data.balance > 0
                ? t('dashboard.surplusPerfect').replace('{amount}', data.balance)
                : data.balance === 0
                ? t('dashboard.maintenance')
                : t('dashboard.deficitSlowsGain').replace('{amount}', Math.abs(data.balance))
            )}
          </p>
        </div>

        {/* Progress Bar Calorie Assunte con segmenti per pasto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <ArrowUp className={data.isWeightLoss ? "w-4 h-4 text-red-600" : "w-4 h-4 text-green-600"} />
              {t('dashboard.caloriesConsumed')}
            </span>
            <span className={data.isWeightLoss ? "font-bold text-red-600" : "font-bold text-green-600"}>{data.consumedCalories} kcal</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="h-full flex">
              {data.mealSegments?.map((segment, index) => {
                const segmentWidth = (segment.calories / Math.max(data.consumedCalories, data.totalBurned)) * 100;
                const baseColor = data.isWeightLoss ? 'red' : 'green';
                
                return (
                  <React.Fragment key={segment.meal_type}>
                    <div 
                      className={`h-full transition-all ${
                        segment.isLogged 
                          ? (baseColor === 'red' ? 'bg-red-500' : 'bg-green-500')
                          : (baseColor === 'red' ? 'bg-red-300' : 'bg-green-300')
                      } ${!segment.isLogged ? 'opacity-60' : ''}`}
                      style={{ 
                        width: `${segmentWidth}%`,
                        backgroundImage: !segment.isLogged 
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 10px)'
                          : 'none'
                      }}
                    />
                    {index < data.mealSegments.length - 1 && (
                      <div className="w-[2px] h-full bg-white opacity-80" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('dashboard.plannedMealsNote')}
          </p>
        </div>

        {/* Calorie Bruciate - Raggruppate */}
        <div className="space-y-3">
          {/* Titolo principale con totale */}
          <div className="flex items-center justify-between text-sm pb-2 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-2">
              <Flame className={data.isWeightLoss ? "w-5 h-5 text-green-600" : "w-5 h-5 text-red-600"} />
              {t('dashboard.caloriesBurned')}
            </span>
            <span className={data.isWeightLoss ? "font-bold text-lg text-green-600" : "font-bold text-lg text-red-600"}>
              {data.totalBurned} kcal
            </span>
          </div>

          {/* Progress Bar BMR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600">
                {t('dashboard.caloriesBurnedBMR')}
              </span>
              <span className={data.isWeightLoss ? "font-semibold text-green-600" : "font-semibold text-red-600"}>{data.bmr} kcal</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={data.isWeightLoss ? "h-full bg-green-600" : "h-full bg-red-600"}
                style={{ width: `${(data.bmr / Math.max(data.consumedCalories, data.totalBurned)) * 100}%` }}
              />
            </div>
          </div>

          {/* Progress Bar NEAT - allineato con BMR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {t('dashboard.neatActivity')}
                </span>
                {healthKitData && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    HealthKit
                  </span>
                )}
              </div>
              <span className={data.isWeightLoss ? "font-semibold text-green-400" : "font-semibold text-red-400"}>{data.neat} kcal</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div 
                className={data.isWeightLoss ? "h-full bg-green-400 absolute top-0" : "h-full bg-red-400 absolute top-0"}
                style={{ 
                  left: `${(data.bmr / Math.max(data.consumedCalories, data.totalBurned)) * 100}%`,
                  width: `${(data.neat / Math.max(data.consumedCalories, data.totalBurned)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Progress Bar Dispositivo Salute - sotto NEAT - SOLO PREMIUM */}
          {user?.subscription_plan === 'premium' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    🍎 Dispositivo salute
                  </span>
                  {healthKitData ? (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Attivo
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      In attesa dati
                    </span>
                  )}
                </div>
                <span className={`font-semibold ${healthKitData ? 'text-purple-600' : 'text-gray-400'}`}>
                  {healthKitData?.active_energy_burned_kcal ? Math.round(healthKitData.active_energy_burned_kcal) : 0} kcal
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full absolute top-0 ${healthKitData ? 'bg-purple-500' : 'bg-gray-300'}`}
                  style={{ 
                    left: `${(data.bmr / Math.max(data.consumedCalories, data.totalBurned)) * 100}%`,
                    width: healthKitData?.active_energy_burned_kcal 
                      ? `${(healthKitData.active_energy_burned_kcal / Math.max(data.consumedCalories, data.totalBurned)) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              {!healthKitData && (
                <p className="text-xs text-gray-500">
                  📲 Connetti il dispositivo dall'app mobile per visualizzare i dati
                </p>
              )}
            </div>
          )}
          </div>

          </CardContent>
          </Card>

          {showDeviceModal && (
          <Dialog open={showDeviceModal} onOpenChange={setShowDeviceModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Watch className="w-6 h-6 text-[#26847F]" />
                Connetti Dispositivo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  📱 Questa funzione è disponibile solo sull'app mobile MyWellness
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Per connettere il tuo smartwatch e sincronizzare automaticamente i dati di attività:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">🍎</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">iOS (Apple Watch)</p>
                      <p className="text-xs text-gray-600">Scarica l'app mobile e sincronizza con Apple Health</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Android (Wear OS, Samsung Health)</p>
                      <p className="text-xs text-gray-600">Scarica l'app mobile e sincronizza con Google Fit</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Una volta connesso, i tuoi dati di attività verranno aggiornati automaticamente per calcolare le calorie bruciate in modo più preciso
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowDeviceModal(false)}
                className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                Ho Capito
              </Button>
            </div>
          </DialogContent>
          </Dialog>
          )}

          {showUpgradeModal && (
          <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user?.subscription_plan}
          targetPlan="premium"
          />
          )}
          </>
          );
          }