import React from "react";
      import { Link, useLocation, useNavigate } from "react-router-dom";
      import { createPageUrl } from "@/utils";
      import { Home, Utensils, Dumbbell, Settings as SettingsIcon, Tag, FileText, Mail, BarChart3, Target, Activity, Menu as MenuIcon, X, Users, HelpCircle, MessageCircle, Video, Receipt, Plus, X as XIcon, Camera, ScanLine } from "lucide-react";
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
import UnifiedCameraModal from "@/components/camera/UnifiedCameraModal";

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
  const [weightUnit, setWeightUnit] = React.useState('kg');
  const [showProgressAnalysis, setShowProgressAnalysis] = React.useState(false);
  const [showUnifiedCamera, setShowUnifiedCamera] = React.useState(false);

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

        // 🚫 BLOCCO: se subscription non valida e sta cercando di accedere a pagine protette
        const protectedPages = ['/dashboard', '/meals', '/workouts', '/settings'];
        const currentPath = location.pathname.toLowerCase();
        const isProtectedPage = protectedPages.some(p => currentPath.includes(p));

        if (isProtectedPage && currentUser) {
          // Admin e customer support hanno sempre accesso
          if (currentUser.role === 'admin' || currentUser.custom_role === 'customer_support') {
            // Accesso consentito
          } else {
            const validStatuses = ['active', 'trial'];
            if (!validStatuses.includes(currentUser.subscription_status)) {
              console.log(`🚫 Access blocked: subscription_status = ${currentUser.subscription_status}`);
              navigate(createLocalizedPageUrl('pricing', language), { replace: true });
            }
          }
        }
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
  }, [location.pathname, language, navigate]);
  
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
    '/itquiz',
    '/enquiz',
    '/esquiz',
    '/ptquiz',
    '/dequiz',
    '/frquiz',
    createPageUrl('itquiz'),
    createPageUrl('enquiz'),
    createPageUrl('esquiz'),
    createPageUrl('ptquiz'),
    createPageUrl('dequiz'),
    createPageUrl('frquiz'),
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
    // PostQuizSubscription localized pages
    createPageUrl('itpostquizsubscription'),
    createPageUrl('enpostquizsubscription'),
    createPageUrl('espostquizsubscription'),
    createPageUrl('ptpostquizsubscription'),
    createPageUrl('depostquizsubscription'),
    createPageUrl('frpostquizsubscription'),
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
    { name: t('nav.nutrition'), icon: Utensils, path: 'Meals' },
    { name: t('nav.workouts'), icon: Dumbbell, path: 'Workouts' },
    { name: t('nav.settings'), icon: SettingsIcon, path: 'Settings' }
  ];

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
    { name: t('nav.salesTax'), icon: Receipt, path: 'AdminSalesTax', isAdminOnly: true }
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
      const weightValue = weightUnit === 'lbs' 
        ? parseFloat(weightInput) / 2.20462 
        : parseFloat(weightInput);

      const weightData = {
        user_id: user.id,
        weight: weightValue,
        date: today
      };

      await base44.entities.WeightHistory.create(weightData);
      setWeightInput('');
      setWeightUnit('kg');
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
    <div className={`min-h-screen ${!location.pathname.toLowerCase().includes('quiz') ? 'animated-gradient-bg' : 'bg-white'}`}>
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
      body[data-camera-open="true"] > main ~ div {
        display: none !important;
      }
      body[data-camera-open="true"] [data-menu] {
        display: none !important;
      }
      `}</style>
      


      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Registra Peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Inserisci il tuo peso attuale
            </p>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setWeightUnit('kg')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  weightUnit === 'kg'
                    ? 'bg-[#26847F] text-white'
                    : 'bg-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setWeightUnit('lbs')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  weightUnit === 'lbs'
                    ? 'bg-[#26847F] text-white'
                    : 'bg-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                lbs
              </button>
            </div>

            <div>
              <Label htmlFor="weight-input" className="text-sm font-semibold text-gray-700 mb-2 block">
                Peso ({weightUnit})
              </Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={weightUnit === 'kg' ? 'Es: 70.5' : 'Es: 155'}
                className="h-12 text-base"
                min="30"
                max={weightUnit === 'kg' ? '300' : '660'}
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
                  setWeightUnit('kg');
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

      {location.pathname !== createPageUrl('Video') && !location.pathname.toLowerCase().includes('quiz') && (
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

      <main className={location.pathname.toLowerCase().includes('quiz') ? 'pt-0 pb-0' : 'pt-28 pb-20'}>
        {children}
      </main>

      {!location.pathname.toLowerCase().includes('quiz') && (
        <>
          <div className={`hidden md:flex fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 items-center gap-2 ${showUnifiedCamera ? 'invisible' : ''}`}>
            <LiquidGlassNav 
              navItems={allNavItems} 
              onActionClick={handleActionClick}
              showActionMenu={showActionMenu}
              setShowActionMenu={setShowActionMenu}
            />
            <button
              onClick={() => setShowUnifiedCamera(true)}
              className="rounded-full water-glass-effect text-[#26847F] flex items-center justify-center transition-all hover:scale-110 font-bold flex-shrink-0"
              style={{
                width: '56px',
                height: '56px',
                boxShadow: '0 8px 24px 0 rgba(38, 132, 127, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(38, 132, 127, 0.1)',
                transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              title="Quick Actions"
            >
              <Plus className="w-6 h-6" strokeWidth={3} />
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
              onClick={() => setShowUnifiedCamera(true)}
              className="rounded-full water-glass-effect text-[#26847F] flex items-center justify-center transition-all hover:scale-110 font-bold flex-shrink-0 w-[93px] h-[93px]"
              style={{
                boxShadow: '0 8px 24px 0 rgba(38, 132, 127, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(38, 132, 127, 0.1)',
                transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              title="Quick Actions"
            >
              <Plus className="w-10 h-10" strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}




      {showProgressAnalysis && user && (
        <ProgressPhotoAnalyzer
          user={user}
          onClose={() => setShowProgressAnalysis(false)}
          onAnalysisComplete={() => setShowProgressAnalysis(false)}
          onOpenPhotoGallery={() => {}}
        />
      )}

      <UnifiedCameraModal
        isOpen={showUnifiedCamera}
        onClose={() => setShowUnifiedCamera(false)}
        user={user}
      />
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