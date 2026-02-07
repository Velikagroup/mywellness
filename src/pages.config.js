/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import _404 from './pages/404';
import AdminBlog from './pages/AdminBlog';
import AdminClients from './pages/AdminClients';
import AdminCoupons from './pages/AdminCoupons';
import AdminEmailTest from './pages/AdminEmailTest';
import AdminEmails from './pages/AdminEmails';
import AdminMarketing from './pages/AdminMarketing';
import AdminSalesTax from './pages/AdminSalesTax';
import AdminSupportTickets from './pages/AdminSupportTickets';
import AuthCallback from './pages/AuthCallback';
import Blog from './pages/Blog';
import BlogArticle from './pages/BlogArticle';
import BodyScan from './pages/BodyScan';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Landing from './pages/Landing';
import LandingCheckout from './pages/LandingCheckout';
import Meals from './pages/Meals';
import NotFound from './pages/NotFound';
import OneTimeOffer from './pages/OneTimeOffer';
import PostQuizSubscription from './pages/PostQuizSubscription';
import Privacy from './pages/Privacy';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Sfondo from './pages/Sfondo';
import Terms from './pages/Terms';
import ThankYou from './pages/ThankYou';
import TikTokTest from './pages/TikTokTest';
import TrialSetup from './pages/TrialSetup';
import Workouts from './pages/Workouts';
import blogarticle from './pages/blogarticle';
import de from './pages/de';
import deblog from './pages/deblog';
import deblogarticle from './pages/deblogarticle';
import decheckout from './pages/decheckout';
import depostquizsubscription from './pages/depostquizsubscription';
import depricing from './pages/depricing';
import dequiz from './pages/dequiz';
import en from './pages/en';
import encheckout from './pages/encheckout';
import enpostquizsubscription from './pages/enpostquizsubscription';
import enquiz from './pages/enquiz';
import es from './pages/es';
import esblog from './pages/esblog';
import esblogarticle from './pages/esblogarticle';
import escheckout from './pages/escheckout';
import espostquizsubscription from './pages/espostquizsubscription';
import espricing from './pages/espricing';
import esquiz from './pages/esquiz';
import fr from './pages/fr';
import frblog from './pages/frblog';
import frblogarticle from './pages/frblogarticle';
import frcheckout from './pages/frcheckout';
import frpostquizsubscription from './pages/frpostquizsubscription';
import frpricing from './pages/frpricing';
import frquiz from './pages/frquiz';
import it from './pages/it';
import itblog from './pages/itblog';
import itblogarticle from './pages/itblogarticle';
import itcheckout from './pages/itcheckout';
import itpostquizsubscription from './pages/itpostquizsubscription';
import itpricing from './pages/itpricing';
import itquiz from './pages/itquiz';
import pricing from './pages/pricing';
import pt from './pages/pt';
import ptblog from './pages/ptblog';
import ptblogarticle from './pages/ptblogarticle';
import ptcheckout from './pages/ptcheckout';
import ptpostquizsubscription from './pages/ptpostquizsubscription';
import ptpricing from './pages/ptpricing';
import ptquiz from './pages/ptquiz';
import AdminAnalytics from './pages/AdminAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "404": _404,
    "AdminBlog": AdminBlog,
    "AdminClients": AdminClients,
    "AdminCoupons": AdminCoupons,
    "AdminEmailTest": AdminEmailTest,
    "AdminEmails": AdminEmails,
    "AdminMarketing": AdminMarketing,
    "AdminSalesTax": AdminSalesTax,
    "AdminSupportTickets": AdminSupportTickets,
    "AuthCallback": AuthCallback,
    "Blog": Blog,
    "BlogArticle": BlogArticle,
    "BodyScan": BodyScan,
    "Checkout": Checkout,
    "Dashboard": Dashboard,
    "Home": Home,
    "Landing": Landing,
    "LandingCheckout": LandingCheckout,
    "Meals": Meals,
    "NotFound": NotFound,
    "OneTimeOffer": OneTimeOffer,
    "PostQuizSubscription": PostQuizSubscription,
    "Privacy": Privacy,
    "ResetPassword": ResetPassword,
    "Settings": Settings,
    "Sfondo": Sfondo,
    "Terms": Terms,
    "ThankYou": ThankYou,
    "TikTokTest": TikTokTest,
    "TrialSetup": TrialSetup,
    "Workouts": Workouts,
    "blogarticle": blogarticle,
    "de": de,
    "deblog": deblog,
    "deblogarticle": deblogarticle,
    "decheckout": decheckout,
    "depostquizsubscription": depostquizsubscription,
    "depricing": depricing,
    "dequiz": dequiz,
    "en": en,
    "encheckout": encheckout,
    "enpostquizsubscription": enpostquizsubscription,
    "enquiz": enquiz,
    "es": es,
    "esblog": esblog,
    "esblogarticle": esblogarticle,
    "escheckout": escheckout,
    "espostquizsubscription": espostquizsubscription,
    "espricing": espricing,
    "esquiz": esquiz,
    "fr": fr,
    "frblog": frblog,
    "frblogarticle": frblogarticle,
    "frcheckout": frcheckout,
    "frpostquizsubscription": frpostquizsubscription,
    "frpricing": frpricing,
    "frquiz": frquiz,
    "it": it,
    "itblog": itblog,
    "itblogarticle": itblogarticle,
    "itcheckout": itcheckout,
    "itpostquizsubscription": itpostquizsubscription,
    "itpricing": itpricing,
    "itquiz": itquiz,
    "pricing": pricing,
    "pt": pt,
    "ptblog": ptblog,
    "ptblogarticle": ptblogarticle,
    "ptcheckout": ptcheckout,
    "ptpostquizsubscription": ptpostquizsubscription,
    "ptpricing": ptpricing,
    "ptquiz": ptquiz,
    "AdminAnalytics": AdminAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};