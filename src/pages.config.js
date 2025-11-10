import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Meals from './pages/Meals';
import Workouts from './pages/Workouts';
import Home from './pages/Home';
import pricing from './pages/pricing';
import TrialSetup from './pages/TrialSetup';
import AdminCoupons from './pages/AdminCoupons';
import Blog from './pages/Blog';
import BlogArticle from './pages/BlogArticle';
import AdminBlog from './pages/AdminBlog';
import Landing from './pages/Landing';
import OneTimeOffer from './pages/OneTimeOffer';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LandingCheckout from './pages/LandingCheckout';
import ThankYou from './pages/ThankYou';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import AdminEmails from './pages/AdminEmails';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminMarketing from './pages/AdminMarketing';
import AdminSalesTax from './pages/AdminSalesTax';
import AdminClients from './pages/AdminClients';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Quiz": Quiz,
    "Meals": Meals,
    "Workouts": Workouts,
    "Home": Home,
    "pricing": pricing,
    "TrialSetup": TrialSetup,
    "AdminCoupons": AdminCoupons,
    "Blog": Blog,
    "BlogArticle": BlogArticle,
    "AdminBlog": AdminBlog,
    "Landing": Landing,
    "OneTimeOffer": OneTimeOffer,
    "Terms": Terms,
    "Privacy": Privacy,
    "LandingCheckout": LandingCheckout,
    "ThankYou": ThankYou,
    "ResetPassword": ResetPassword,
    "NotFound": NotFound,
    "AdminEmails": AdminEmails,
    "AdminAnalytics": AdminAnalytics,
    "AdminMarketing": AdminMarketing,
    "AdminSalesTax": AdminSalesTax,
    "AdminClients": AdminClients,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};