
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Utensils, Dumbbell, LogOut, Tag, FileText, Mail, BarChart3, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasFeatureAccess } from "@/components/utils/subscriptionPlans";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

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
    createPageUrl('AdminAnalytics'), // Added for AdminAnalytics
    createPageUrl('AdminMarketing')
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

  const allNavItems = [
    { name: 'Dashboard', icon: Home, path: 'Dashboard' },
    { name: 'Nutrizione', icon: Utensils, path: 'Meals' },
    { name: 'Allenamento', icon: Dumbbell, path: 'Workouts', requiresFeature: 'workout_plan' }
  ];
  
  if (user && user.role === 'admin') {
      allNavItems.push({ name: 'Coupon', icon: Tag, path: 'AdminCoupons' });
      allNavItems.push({ name: 'Blog', icon: FileText, path: 'AdminBlog' });
      allNavItems.push({ name: 'Email', icon: Mail, path: 'AdminEmails' });
      allNavItems.push({ name: 'Analytics', icon: BarChart3, path: 'AdminAnalytics' });
      allNavItems.push({ name: 'Marketing', icon: Target, path: 'AdminMarketing' });
  }

  const navItems = allNavItems.filter(item => {
    if (item.requiresFeature && user) {
      return hasFeatureAccess(user.subscription_plan, item.requiresFeature);
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      const homeUrl = window.location.origin + createPageUrl('Home');
      await base44.auth.logout(homeUrl);
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
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
            rgba(249, 250, 251, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
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
      <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 ${
        navItems.length <= 4 ? 'max-w-2xl' : 'max-w-5xl'
      }`}>
        <div className="water-glass-effect rounded-3xl py-3 px-2">
          {/* Desktop/Tablet - Single Row */}
          <div className="hidden sm:flex items-center justify-around">
            {navItems.map((item) => (
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

          {/* Mobile - Two Rows (max 4 items per row) */}
          <div className="sm:hidden">
            {navItems.length <= 4 ? (
              // Single row for 4 or fewer items
              <div className="flex items-center justify-around">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 max-w-[80px] ${
                      location.pathname === createPageUrl(item.path)
                        ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                ))}
                
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 max-w-[80px] text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-medium">Esci</span>
                </button>
              </div>
            ) : (
              // Two rows for more than 4 items
              <div className="space-y-2">
                {/* First Row - First 4 items */}
                <div className="flex items-center justify-around">
                  {navItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 max-w-[80px] ${
                        location.pathname === createPageUrl(item.path)
                          ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                          : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium text-center">{item.name}</span>
                    </Link>
                  ))}
                </div>

                {/* Second Row - Remaining items + Logout */}
                <div className="flex items-center justify-around">
                  {navItems.slice(4).map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 max-w-[80px] ${
                        location.pathname === createPageUrl(item.path)
                          ? 'text-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                          : 'text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium text-center">{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* Logout button is always present in the second row for mobile if there are more than 4 items */}
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors flex-1 max-w-[80px] text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-xs font-medium">Esci</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
