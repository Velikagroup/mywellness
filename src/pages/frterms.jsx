import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FrTerms() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{
      background: '#f9fafb',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
        radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
        radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        :root {
          --brand-primary: #26847F;
          --brand-primary-hover: #1f6b66;
          --brand-primary-light: #e9f6f5;
        }
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.75) 0%, rgba(243, 244, 246, 0.65) 50%, rgba(249, 250, 251, 0.75) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-[300px]">
        <div className="water-glass-effect rounded-full px-6 py-3 flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/c3567e77e_MyWellnesslogo.png"
            alt="MyWellness"
            className="h-6 cursor-pointer"
            onClick={() => navigate(createPageUrl('frhome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Conditions Générales</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Dernière mise à jour: Janvier 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des Conditions</h2>
              <p>
                En accédant et en utilisant MyWellness (le "Service"), exploité par VELIKA GROUP LLC ("nous", "notre"), vous ("vous", "votre") acceptez d'être lié par ces Conditions Générales. Si vous n'acceptez pas ces conditions, n'utilisez pas le Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du Service</h2>
              <p>
                MyWellness fournit des plans nutritionnels et d'entraînement personnalisés générés par intelligence artificielle. Le Service comprend l'analyse corporelle, le suivi des progrès, des recettes personnalisées et des routines d'entraînement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Abonnements et Paiements</h2>
              <p className="mb-3">
                <strong>3.1 Période d'essai:</strong> Nous offrons une période d'essai gratuite de 3 jours. Pendant cette période, aucun frais ne sera facturé. Vous pouvez annuler à tout moment avant l'expiration de la période d'essai.
              </p>
              <p className="mb-3">
                <strong>3.2 Renouvellement automatique:</strong> À la fin de la période d'essai, l'abonnement sera automatiquement renouvelé au plan sélectionné (Base, Pro ou Premium) avec facturation mensuelle ou annuelle selon votre choix.
              </p>
              <p className="mb-3">
                <strong>3.3 Tarifs:</strong> Les prix sont indiqués en Euros (€) et peuvent varier. Le prix applicable est celui affiché au moment de l'achat.
              </p>
              <p>
                <strong>3.4 Annulation:</strong> Vous pouvez annuler votre abonnement à tout moment via les paramètres de votre compte. L'annulation prendra effet à la fin de la période de facturation en cours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compte Utilisateur</h2>
              <p className="mb-3">
                <strong>4.1 Inscription:</strong> Pour utiliser le Service, vous devez créer un compte en fournissant des informations précises et complètes.
              </p>
              <p className="mb-3">
                <strong>4.2 Sécurité:</strong> Vous êtes responsable de la sécurité de votre compte et de la confidentialité de vos identifiants de connexion.
              </p>
              <p>
                <strong>4.3 Âge minimum:</strong> Vous devez avoir au moins 18 ans pour utiliser le Service. Si vous avez moins de 18 ans, vous devez obtenir le consentement d'un parent ou tuteur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Utilisation Acceptable</h2>
              <p className="mb-3">Vous vous engagez à:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utiliser le Service uniquement à des fins personnelles et non commerciales</li>
                <li>Fournir des informations précises sur votre profil de santé</li>
                <li>Ne pas partager votre compte avec d'autres personnes</li>
                <li>Ne pas utiliser le Service pour des activités illégales ou non autorisées</li>
                <li>Ne pas tenter de violer la sécurité du Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Avertissement Médical</h2>
              <p className="mb-3">
                <strong>IMPORTANT:</strong> MyWellness ne fournit PAS de conseils médicaux. Les plans nutritionnels et d'entraînement sont générés par intelligence artificielle et ont un but exclusivement informatif et éducatif.
              </p>
              <p className="mb-3">
                Avant de commencer tout programme nutritionnel ou d'exercice physique, consultez votre médecin ou un professionnel de santé qualifié, surtout si vous avez des conditions médicales préexistantes, êtes enceinte, allaitez ou prenez des médicaments.
              </p>
              <p>
                L'utilisation du Service est à vos propres risques et responsabilité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété Intellectuelle</h2>
              <p>
                Tout le contenu, logiciel, code, design, graphiques, logos et matériels présents dans le Service sont la propriété exclusive de VELIKA GROUP LLC et sont protégés par des droits d'auteur, marques et autres lois sur la propriété intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation de Responsabilité</h2>
              <p className="mb-3">
                Dans la mesure maximale permise par la loi, VELIKA GROUP LLC ne sera pas responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dommages directs, indirects, accessoires, consécutifs ou punitifs</li>
                <li>Perte de profits, données ou opportunités commerciales</li>
                <li>Blessures physiques ou dommages à la santé résultant de l'utilisation du Service</li>
                <li>Interruptions ou erreurs dans le Service</li>
                <li>Contenu ou comportement de tiers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications des Conditions</h2>
              <p>
                Nous nous réservons le droit de modifier ces Conditions Générales à tout moment. Les modifications seront effectives immédiatement après publication. L'utilisation continue du Service après les modifications constitue l'acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Résiliation</h2>
              <p>
                Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation de ces Conditions, sans préavis et sans remboursement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Loi Applicable</h2>
              <p>
                Ces Conditions sont régies par les lois de l'État du Wyoming, États-Unis, sans égard aux principes de conflits de lois.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
              <p>
                Pour des questions sur ces Conditions Générales, contactez-nous:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">VELIKA GROUP LLC</p>
                <p>30 N Gould St 32651</p>
                <p>Sheridan, WY 82801, United States</p>
                <p>EIN: 36-5141800</p>
                <p>Email: velika.03@outlook.it</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              © VELIKA GROUP LLC. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-500">
              30 N Gould St 32651 Sheridan, WY 82801, United States
            </p>
            <p className="text-xs text-gray-500">
              EIN: 36-5141800 - velika.03@outlook.it
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}