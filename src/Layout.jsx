import React from "react";
      import { Link, useLocation, useNavigate } from "react-router-dom";
      import { createPageUrl } from "@/utils";
      import { Home, Utensils, Dumbbell, Settings as SettingsIcon, Tag, FileText, Mail, BarChart3, Target, Activity, Menu as MenuIcon, X, Users, HelpCircle, MessageCircle, Video, Receipt, Plus, X as XIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasFeatureAccess } from "@/components/utils/subscriptionPlans";
import { LanguageProvider, useLanguage, createLocalizedPageUrl } from "@/components/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Scale, Save } from "lucide-react";
import LiquidGlassNav from "@/components/navigation/LiquidGlassNav";
import ProgressPhotoAnalyzer from "@/components/training/ProgressPhotoAnalyzer";

function LayoutContent({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showActionMenu, setShowActionMenu] = React.useState(false);
  const [showWeightModal, setShowWeightModal] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [isSavingWeight, setIsSavingWeight] = React.useState(false);
  const [showProgressAnalysis, setShowProgressAnalysis] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // TikTok Pixel
  React.useEffect(() => {
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
      ttq.load('D50ASNBC77UDC9ALLB2G');
      ttq.page();
    }(window, document, 'ttq');
  }, []);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        if (error?.response?.status === 401 ||
            error?.message?.includes('401') ||
            error?.message?.includes('Authentication required')) {
          setUser(null);
        } else {
          console.error("Error loading user in layout:", error);
        }
      }
    };
    loadUser();
  }, []);
  
  const fontOption = "inter";
  
  const fontStyles = {
    default: {
      import: "",
      family: "system-ui, -apple-system, sans-serif"
    },
    inter: {
      import: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",
      family: "'Inter', sans-serif"
    },
    poppins: {
      import: "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');",
      family: "'Poppins', sans-serif"
    },
    outfit: {
      import: "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');",
      family: "'Outfit', sans-serif"
    },
    jakarta: {
      import: "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');",
      family: "'Plus Jakarta Sans', sans-serif"
    },
    manrope: {
      import: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');",
      family: "'Manrope', sans-serif"
    }
  };

  const pathsWithoutLayout = [
    createPageUrl('Quiz'),
    createPageUrl('Home'),
    createPageUrl('Landing'),
    createPageUrl('pricing'),
    createPageUrl('TrialSetup'),
    createPageUrl('Checkout'),
    createPageUrl('LandingCheckout'),
    createPageUrl('ThankYou'),
    createPageUrl('ResetPassword'),
    createPageUrl('Blog'),
    createPageUrl('BlogArticle'),
    createPageUrl('OneTimeOffer'),
    createPageUrl('Terms'),
    createPageUrl('Privacy'),
    createPageUrl('ApplePayVerification'),
    createPageUrl('NotFound'),
    createPageUrl('AuthCallback'),
    // Checkout pages
    createPageUrl('itcheckout'),
    createPageUrl('encheckout'),
    createPageUrl('escheckout'),
    createPageUrl('ptcheckout'),
    createPageUrl('decheckout'),
    createPageUrl('frcheckout'),
    // Localized quiz pages
    createPageUrl('itquiz'),
    createPageUrl('enquiz'),
    createPageUrl('esquiz'),
    createPageUrl('ptquiz'),
    createPageUrl('dequiz'),
    createPageUrl('frquiz'),
    // Localized pricing pages
    createPageUrl('itpricing'),
    createPageUrl('espricing'),
    createPageUrl('ptpricing'),
    createPageUrl('depricing'),
    createPageUrl('frpricing'),
    // Localized blog pages
    createPageUrl('itblog'),
    createPageUrl('esblog'),
    createPageUrl('ptblog'),
    createPageUrl('deblog'),
    createPageUrl('frblog'),
    // Localized blog article pages
    createPageUrl('blogarticle'),
    createPageUrl('itblogarticle'),
    createPageUrl('esblogarticle'),
    createPageUrl('ptblogarticle'),
    createPageUrl('deblogarticle'),
    createPageUrl('frblogarticle'),
    // Localized home pages
    createPageUrl('it'),
    createPageUrl('en'),
    createPageUrl('es'),
    createPageUrl('pt'),
    createPageUrl('de'),
    createPageUrl('fr'),
    '/',
    // Add localized versions
    ...['it', 'en', 'es', 'pt', 'de', 'fr'].flatMap(lang => [
      `/${lang}`,
      `/${lang}/quiz`,
      `/${lang}/landing`,
      `/${lang}/pricing`,
      `/${lang}/trial-setup`,
      `/${lang}/checkout`,
      `/${lang}/landing-checkout`,
      `/${lang}/thank-you`,
      `/${lang}/reset-password`,
      `/${lang}/blog`,
      `/${lang}/one-time-offer`,
      `/${lang}/terms`,
      `/${lang}/privacy`,
      `/${lang}/404`
    ])
  ];

  // Se è una pagina senza layout, renderizza solo children
  const pathLower = location.pathname.toLowerCase();
  if (pathsWithoutLayout.some(p => p.toLowerCase() === pathLower) || 
      pathLower.match(/^\/blog(\/|$)/) ||
      pathLower.match(/^\/(it|en|es|pt|de|fr)\/blog(\/|$)/)) {
    return <>{children}</>;
  }

  const mainNavItems = [
    { name: t('nav.dashboard'), icon: Home, path: 'Dashboard' },
    { name: t('nav.nutrition'), icon: Utensils, path: 'Meals', requiresFeature: 'meal_plan' },
    { name: t('nav.workouts'), icon: Dumbbell, path: 'Workouts', requiresFeature: 'workout_plan' },
    { name: t('nav.settings'), icon: SettingsIcon, path: 'Settings' }
  ].filter(item => {
    if (item.requiresFeature && user) {
      return hasFeatureAccess(user.subscription_plan, item.requiresFeature);
    }
    return true;
  });

  const hasManagementAccess = user && (user.role === 'admin' || user.custom_role === 'customer_support');

  const customerSupportMenuItems = user && user.custom_role === 'customer_support' ? [
    { name: t('nav.clients'), icon: Users, path: 'AdminClients', isAdminOnly: true },
    { name: t('nav.tickets'), icon: HelpCircle, path: 'AdminSupportTickets', isAdminOnly: true },
    { name: t('nav.feedback'), icon: MessageCircle, path: 'AdminFeedback', isAdminOnly: true },
    { name: t('nav.coupons'), icon: Tag, path: 'AdminCoupons', isAdminOnly: true },
    { name: t('nav.blog'), icon: FileText, path: 'AdminBlog', isAdminOnly: true },
    { name: t('nav.email'), icon: Mail, path: 'AdminEmails', isAdminOnly: true },
    { name: t('nav.marketing'), icon: Target, path: 'AdminMarketing', isAdminOnly: true }
  ] : [];

  const adminMenuItems = user && user.role === 'admin' ? [
    { name: t('nav.clients'), icon: Users, path: 'AdminClients', isAdminOnly: true },
    { name: t('nav.tickets'), icon: HelpCircle, path: 'AdminSupportTickets', isAdminOnly: true },
    { name: t('nav.feedback'), icon: MessageCircle, path: 'AdminFeedback', isAdminOnly: true },
    { name: t('nav.coupons'), icon: Tag, path: 'AdminCoupons', isAdminOnly: true },
    { name: t('nav.blog'), icon: FileText, path: 'AdminBlog', isAdminOnly: true },
    { name: t('nav.email'), icon: Mail, path: 'AdminEmails', isAdminOnly: true },
    { name: t('nav.analytics'), icon: BarChart3, path: 'AdminAnalytics', isAdminOnly: true },
    { name: t('nav.marketing'), icon: Target, path: 'AdminMarketing', isAdminOnly: true },
    { name: t('nav.salesTax'), icon: Receipt, path: 'AdminSalesTax', isAdminOnly: true },
    { name: 'Video', icon: Video, path: 'Video', isAdminOnly: true }
  ] : [];

  const managementMenuItems = user?.role === 'admin' ? adminMenuItems : 
                               user?.custom_role === 'customer_support' ? customerSupportMenuItems : [];

  const allNavItems = [...mainNavItems, ...managementMenuItems];

  const getMenuMaxWidth = () => {
    const itemCount = allNavItems.length;
    const baseWidth = itemCount * 90;
    const totalWidth = baseWidth + 40;
    return Math.min(totalWidth, 1280);
  };

  const handleMenuItemClick = (path) => {
    setMobileMenuOpen(false);
    navigate(createPageUrl(path));
  };

  const handleActionClick = (action) => {
    if (action === 'openActionMenu') {
      setShowActionMenu(true);
    }
  };

  const handleSaveWeight = async () => {
    if (!weightInput || !user) {
      alert(t('progressChart.enterValidWeight') || 'Inserisci un peso valido');
      return;
    }
    
    setIsSavingWeight(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weightData = {
        user_id: user.id,
        weight: parseFloat(weightInput),
        date: today
      };
      
      await base44.entities.WeightHistory.create(weightData);
      setWeightInput('');
      setShowWeightModal(false);
      setShowActionMenu(false);
      alert('✅ ' + (t('progressChart.weightSaved') || 'Peso registrato con successo'));
    } catch (error) {
      console.error("Error saving weight:", error);
      alert('Errore durante la registrazione del peso. Riprova.');
    }
    setIsSavingWeight(false);
  };

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        ${fontStyles[fontOption].import}
        
        * {
          font-family: ${fontStyles[fontOption].family};
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
          33% {
            background-position: 100% 30%, 0% 70%, 100% 40%, 20% 80%, 70% 20%, 0% 60%;
          }
          66% {
            background-position: 0% 70%, 100% 40%, 0% 20%, 80% 30%, 40% 90%, 100% 50%;
          }
          100% {
            background-position: 0% 50%, 100% 20%, 0% 80%, 80% 60%, 30% 40%, 100% 90%;
          }
        }
        
        .animated-gradient-bg {
          background: #f9fafb;
          background-image: 
            radial-gradient(circle at 10% 20%, #f5f9ff 0%, transparent 50%),
            radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, #d4bbff 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
            radial-gradient(circle at 90% 85%, #e0ccff 0%, transparent 50%);
          background-size: 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%, 250% 250%;
          animation: gradientShift 45s ease-in-out infinite;
          background-attachment: fixed;
        }
        
        body {
          background: #f9fafb !important;
        }
        
        #root {
          background: transparent !important;
        }
        
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

        .mobile-menu-expanded {
          animation: expandUp 0.3s ease-out forwards;
          max-height: 0;
          overflow: hidden;
        }

        @keyframes expandUp {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 500px;
            opacity: 1;
          }
        }

        @keyframes popUpFromButton {
          from {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.3);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        .popup-action-menu {
          animation: popUpFromButton 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes slideUpFromBottom {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-menu-drawer {
          animation: slideUpFromBottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      body[data-camera-open="true"] [data-menu] {
        display: none !important;
      }
      `}</style>
      
      {showActionMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs" 
            onClick={() => setShowActionMenu(false)} 
          />
          <div className="fixed top-1/2 left-1/2 z-50 action-menu-drawer -translate-x-1/2 -translate-y-1/2">
            <div className="water-glass-effect rounded-2xl p-3 w-56 shadow-2xl" style={{
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate(createPageUrl('Dashboard'));
                    setShowActionMenu(false);
                  }}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-2.5 px-3 rounded-lg transition-colors text-sm"
                >
                  Count Calories
                </button>
                <button
                  onClick={() => {
                    setShowWeightModal(true);
                  }}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-2.5 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4" />
                  Log Weight
                </button>
                <button
                  onClick={() => {
                    navigate(createPageUrl('BodyScan'));
                    setShowActionMenu(false);
                  }}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-2.5 px-3 rounded-lg transition-colors text-sm"
                >
                  Body Scan
                </button>
                <button
                  onClick={() => {
                    setShowProgressAnalysis(true);
                    setShowActionMenu(false);
                  }}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white font-semibold py-2.5 px-3 rounded-lg transition-colors text-sm"
                >
                  🤖 Analisi AI
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Registra Peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Inserisci il tuo peso attuale
            </p>
            <div>
              <Label htmlFor="weight-input" className="text-sm font-semibold text-gray-700 mb-2 block">
                Peso (kg)
              </Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="Es: 70.5"
                className="h-12 text-base"
                min="30"
                max="300"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveWeight}
                disabled={isSavingWeight || !weightInput}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingWeight ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button
                onClick={() => {
                  setShowWeightModal(false);
                  setWeightInput('');
                }}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {location.pathname !== createPageUrl('Video') && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="water-glass-effect rounded-full px-6 py-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png" 
              alt="MyWellness" 
              className="h-6"
            />
          </div>
        </div>
      )}

      <main className="pt-28 pb-20">
        {children}
      </main>

      <div className="hidden md:flex fixed bottom-6 left-4 z-50 items-center gap-3">
        <LiquidGlassNav 
          navItems={allNavItems} 
          onActionClick={handleActionClick}
          showActionMenu={showActionMenu}
          setShowActionMenu={setShowActionMenu}
        />
        <button
          onClick={() => setShowActionMenu(!showActionMenu)}
          className="rounded-full water-glass-effect text-[#26847F] flex items-center justify-center transition-all hover:scale-110 font-bold flex-shrink-0"
          style={{
            width: '64px',
            height: '64px',
            boxShadow: '0 8px 24px 0 rgba(38, 132, 127, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(38, 132, 127, 0.1)',
            transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
          title="Quick Actions"
        >
          {showActionMenu ? (
            <XIcon className="w-7 h-7" strokeWidth={3} />
          ) : (
            <Plus className="w-7 h-7" strokeWidth={3} />
          )}
        </button>
      </div>

      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center gap-3" data-menu="mobile-nav">
        <div className="flex-1">
          <LiquidGlassNav 
            navItems={allNavItems} 
            onActionClick={handleActionClick}
            showActionMenu={showActionMenu}
            setShowActionMenu={setShowActionMenu}
          />
        </div>
        <button
          onClick={() => setShowActionMenu(!showActionMenu)}
          className="rounded-full water-glass-effect text-[#26847F] flex items-center justify-center transition-all hover:scale-110 font-bold flex-shrink-0"
          style={{
            width: '64px',
            height: '64px',
            boxShadow: '0 8px 24px 0 rgba(38, 132, 127, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(38, 132, 127, 0.1)',
            transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
          title="Quick Actions"
        >
          {showActionMenu ? (
            <XIcon className="w-7 h-7" strokeWidth={3} />
          ) : (
            <Plus className="w-7 h-7" strokeWidth={3} />
          )}
        </button>
      </div>





      {showProgressAnalysis && user && (
        <ProgressPhotoAnalyzer
          user={user}
          onClose={() => setShowProgressAnalysis(false)}
          onAnalysisComplete={() => setShowProgressAnalysis(false)}
          onOpenPhotoGallery={() => {}}
        />
      )}
    </div>
  );
}

          export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}