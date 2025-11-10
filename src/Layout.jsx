
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Utensils, Dumbbell, LogOut, Tag, FileText, Mail, BarChart3, Target, Activity, Menu as MenuIcon, X, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasFeatureAccess } from "@/components/utils/subscriptionPlans";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Ignora completamente gli errori di autenticazione (è normale per utenti non loggati)
        if (error?.response?.status === 401 ||
            error?.message?.includes('401') ||
            error?.message?.includes('Authentication required')) {
          // Utente non autenticato - non è un errore, è normale
          setUser(null);
        } else {
          // Solo errori veri dovrebbero essere loggati
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

  // Lista di pagine valide che DEVONO avere il layout con menu bottom
  const validPathsWithLayout = [
    createPageUrl('Dashboard'),
    createPageUrl('Meals'),
    createPageUrl('Workouts'),
    createPageUrl('AdminCoupons'),
    createPageUrl('AdminBlog'),
    createPageUrl('AdminEmails'),
    createPageUrl('AdminAnalytics'),
    createPageUrl('AdminMarketing'),
    createPageUrl('AdminSalesTax'),
    createPageUrl('AdminClients')
  ];

  // Pagine che NON devono avere il layout
  const pathsWithoutLayout = [
    createPageUrl('Quiz'),
    createPageUrl('Home'),
    createPageUrl('Landing'),
    createPageUrl('pricing'),
    createPageUrl('TrialSetup'),
    createPageUrl('LandingCheckout'),
    createPageUrl('ThankYou'),
    createPageUrl('ResetPassword'),
    createPageUrl('Blog'),
    createPageUrl('BlogArticle'),
    createPageUrl('OneTimeOffer'),
    createPageUrl('Terms'),
    createPageUrl('Privacy'),
    createPageUrl('ApplePayVerification'),
    '/'
  ];

  // Se il path è esplicitamente senza layout O inizia con /blog/ O non è un path valido con layout
  // (questo include la pagina 404 e qualsiasi altra pagina non prevista)
  if (pathsWithoutLayout.includes(location.pathname) || 
      location.pathname.startsWith('/blog/') ||
      !validPathsWithLayout.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Main navigation items (sempre visibili in mobile)
  const mainNavItems = [
    { name: 'Dashboard', icon: Home, path: 'Dashboard' },
    { name: 'Nutrizione', icon: Utensils, path: 'Meals' },
    { name: 'Allenamento', icon: Dumbbell, path: 'Workouts', requiresFeature: 'workout_plan' }
  ].filter(item => {
    if (item.requiresFeature && user) {
      return hasFeatureAccess(user.subscription_plan, item.requiresFeature);
    }
    return true;
  });

  // Admin menu items (solo nel menu espandibile)
  const adminMenuItems = user && user.role === 'admin' ? [
    { name: 'Clienti', icon: Users, path: 'AdminClients' },
    { name: 'Coupon', icon: Tag, path: 'AdminCoupons' },
    { name: 'Blog', icon: FileText, path: 'AdminBlog' },
    { name: 'Email', icon: Mail, path: 'AdminEmails' },
    { name: 'Analytics', icon: BarChart3, path: 'AdminAnalytics' },
    { name: 'Marketing', icon: Target, path: 'AdminMarketing' },
    { name: 'Sales Tax', icon: Activity, path: 'AdminSalesTax' }
  ] : [];

  // Per desktop, tutti gli item insieme
  const allNavItems = [...mainNavItems, ...adminMenuItems];

  const handleLogout = async () => {
    try {
      const homeUrl = window.location.origin + createPageUrl('Home');
      await base44.auth.logout(homeUrl);
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  const handleMenuItemClick = (path) => {
    setMobileMenuOpen(false);
    navigate(createPageUrl(path));
  };

  return (
    <div className="min-h-screen animated-gradient-bg">
      <style>{`
        ${fontStyles[fontOption].import}
        
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
          --brand-primary-dark-text: #1a5753;
          --brand-primary-light-mixed-color-text: #a8e0d7;
          --brand-secondary-light-mixed-color-text: #e0ccff;
        }
        
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
      `}</style>
      
      {/* Fixed Logo Navbar with Water Effect */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="water-glass-effect rounded-full px-6 py-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png" 
            alt="MyWellness" 
            className="h-6"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-28 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 max-w-2xl sm:max-w-5xl">
        <div className="water-glass-effect rounded-3xl py-3 px-2">
          {/* Desktop - Single Row */}
          <div className="hidden sm:flex items-center justify-around">
            {allNavItems.map((item) => (
              <Link
                key={item.name}
                to={createPageUrl(item.path)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors min-w-[70px] ${
                  location.pathname === createPageUrl(item.path)
                    ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                    : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors min-w-[70px] text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-medium">Esci</span>
            </button>
          </div>

          {/* Mobile - Menu con espansione */}
          <div className="sm:hidden">
            {/* Menu espanso con pagine admin */}
            {mobileMenuOpen && adminMenuItems.length > 0 && (
              <div className="mobile-menu-expanded pb-4 mb-2 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-2 p-2">
                  {adminMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleMenuItemClick(item.path)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                        location.pathname === createPageUrl(item.path)
                          ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                          : 'text-gray-600 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
                    </button>
                  ))}
                  
                  {/* Logout nel menu espanso */}
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-xs font-medium">Esci</span>
                  </button>
                </div>
              </div>
            )}

            {/* Barra principale sempre visibile */}
            <div className="flex items-center justify-around">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 ${
                    location.pathname === createPageUrl(item.path)
                      ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                      : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">{item.name}</span>
                </Link>
              ))}
              
              {/* Pulsante Menu (solo se ci sono pagine admin) */}
              {adminMenuItems.length > 0 && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 ${
                    mobileMenuOpen
                      ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                      : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                  <span className="text-xs font-medium">Menu</span>
                </button>
              )}
              
              {/* Se non ci sono pagine admin, mostra logout */}
              {adminMenuItems.length === 0 && (
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-medium">Esci</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
