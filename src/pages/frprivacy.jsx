import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FrPrivacy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden animated-gradient-bg">
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Politique de Confidentialité</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Dernière mise à jour: Janvier 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                VELIKA GROUP LLC ("nous", "notre") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations lorsque vous utilisez MyWellness (le "Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous collectons</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Informations que vous fournissez</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données d'inscription:</strong> nom, prénom, email, mot de passe</li>
                <li><strong>Données de paiement:</strong> informations de carte de crédit (traitées en toute sécurité par Stripe)</li>
                <li><strong>Données de facturation:</strong> nom/raison sociale, adresse, code fiscal/numéro de TVA, PEC/SDI</li>
                <li><strong>Données de contact:</strong> numéro de téléphone</li>
                <li><strong>Données de profil:</strong> date de naissance, âge, sexe, taille, poids, mesures corporelles</li>
                <li><strong>Données d'objectifs:</strong> poids cible, type de corps souhaité, zones à améliorer</li>
                <li><strong>Données de style de vie:</strong> niveau d'activité physique, expérience fitness, préférences alimentaires, allergies</li>
                <li><strong>Photos:</strong> images de repas et photos de progrès téléchargées par vous</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Informations collectées automatiquement</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adresse IP</li>
                <li>Type de navigateur et d'appareil</li>
                <li>Système d'exploitation</li>
                <li>Pages visitées et temps passé</li>
                <li>Date et heure d'accès</li>
                <li>Cookies et technologies similaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Comment nous utilisons vos informations</h2>
              <p className="mb-3">Nous utilisons vos données pour:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir et améliorer le Service</li>
                <li>Créer des plans nutritionnels et d'entraînement personnalisés</li>
                <li>Traiter les paiements et gérer les abonnements</li>
                <li>Envoyer des confirmations, factures et communications importantes</li>
                <li>Analyser les progrès et fournir des retours</li>
                <li>Améliorer nos algorithmes d'intelligence artificielle</li>
                <li>Prévenir la fraude et assurer la sécurité</li>
                <li>Répondre aux demandes de support</li>
                <li>Envoyer des communications marketing (uniquement avec consentement)</li>
                <li>Respecter les obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base légale du traitement (RGPD)</h2>
              <p className="mb-3">Pour les utilisateurs de l'Union Européenne, nous traitons les données personnelles sur la base de:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentement:</strong> pour le marketing et les cookies non essentiels</li>
                <li><strong>Exécution du contrat:</strong> pour fournir le Service</li>
                <li><strong>Obligation légale:</strong> pour la conformité fiscale et légale</li>
                <li><strong>Intérêt légitime:</strong> pour améliorer le Service et prévenir la fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accès via Google (Google Sign-In)</h2>
              <p className="mb-3">
                Si vous choisissez d'accéder à MyWellness en utilisant votre compte Google ("Se connecter avec Google"), nous collectons les informations suivantes de votre profil Google:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Nom complet:</strong> pour personnaliser votre expérience</li>
                <li><strong>Adresse email:</strong> pour identifier votre compte et envoyer des communications importantes</li>
                <li><strong>Photo de profil:</strong> pour l'afficher dans votre compte (optionnel)</li>
              </ul>
              <p className="mb-3">
                <strong>Comment nous utilisons ces données:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Pour créer et gérer votre compte MyWellness</li>
                <li>Pour vous authentifier en toute sécurité sans créer un nouveau mot de passe</li>
                <li>Pour personnaliser votre expérience au sein de l'application</li>
              </ul>
              <p className="mb-3">
                Nous n'accédons <strong>PAS</strong> à vos contacts Google, votre historique de navigation, vos fichiers Google Drive ou autres données de votre compte Google. L'accès est limité exclusivement aux informations de profil de base nécessaires à l'authentification.
              </p>
              <p>
                Vous pouvez révoquer l'accès de MyWellness à votre compte Google à tout moment depuis les paramètres de sécurité de votre compte Google à l'adresse: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Partage des données</h2>
              <p className="mb-3">Nous pouvons partager vos données avec:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Fournisseurs de services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> pour le traitement des paiements</li>
                <li><strong>Fournisseurs d'hébergement:</strong> pour stocker les données</li>
                <li><strong>Services d'email:</strong> pour envoyer des communications</li>
                <li><strong>Services d'IA:</strong> pour générer des plans personnalisés et analyser des photos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Autorités légales</h3>
              <p>Lorsque requis par la loi ou pour protéger nos droits.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Transferts d'entreprise</h3>
              <p>En cas de fusion, acquisition ou vente d'actifs.</p>

              <p className="mt-4">Nous ne vendons <strong>PAS</strong> vos données personnelles à des tiers à des fins de marketing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Sécurité des données</h2>
              <p className="mb-3">Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cryptage SSL/TLS pour toutes les transmissions</li>
                <li>Stockage sécurisé des données sur des serveurs protégés</li>
                <li>Accès limité aux données personnelles uniquement au personnel autorisé</li>
                <li>Surveillance régulière pour détecter les vulnérabilités</li>
                <li>Sauvegardes régulières des données</li>
              </ul>
              <p className="mt-4">
                Cependant, aucune méthode de transmission sur Internet n'est complètement sécurisée. Nous ne pouvons garantir la sécurité absolue de vos données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Conservation des données</h2>
              <p className="mb-3">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir le Service et respecter les obligations légales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Comptes actifs:</strong> pendant toute la durée de l'abonnement</li>
                <li><strong>Comptes annulés:</strong> 90 jours après l'annulation (pour permettre la réactivation), puis les données sont supprimées</li>
                <li><strong>Données de facturation:</strong> 10 ans pour obligations fiscales</li>
                <li><strong>Journaux de sécurité:</strong> jusqu'à 12 mois</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Vos droits</h2>
              <p className="mb-3">Conformément au RGPD et autres lois sur la confidentialité, vous avez les droits suivants:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accès:</strong> demander une copie de vos données personnelles</li>
                <li><strong>Rectification:</strong> corriger des données inexactes ou incomplètes</li>
                <li><strong>Effacement:</strong> demander la suppression de vos données ("droit à l'oubli")</li>
                <li><strong>Limitation:</strong> limiter le traitement de vos données</li>
                <li><strong>Portabilité:</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Opposition:</strong> s'opposer au traitement de vos données</li>
                <li><strong>Retrait du consentement:</strong> retirer le consentement précédemment donné</li>
                <li><strong>Réclamation:</strong> déposer une réclamation auprès de l'autorité de contrôle</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="mb-3">
                Nous utilisons des cookies et technologies similaires pour:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies essentiels:</strong> nécessaires au fonctionnement du Service</li>
                <li><strong>Cookies analytiques:</strong> pour comprendre comment vous utilisez le Service</li>
                <li><strong>Cookies marketing:</strong> pour personnaliser les annonces (uniquement avec consentement)</li>
              </ul>
              <p className="mt-4">
                Vous pouvez gérer les préférences de cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Confidentialité des mineurs</h2>
              <p>
                Le Service n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles de mineurs de moins de 18 ans. Si nous découvrons avoir collecté des données d'un mineur, nous les supprimerons immédiatement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Transferts internationaux</h2>
              <p>
                Vos données peuvent être transférées et stockées sur des serveurs aux États-Unis et dans d'autres pays. Nous mettons en œuvre des protections appropriées pour garantir que vos données soient protégées conformément à cette Politique de Confidentialité et aux lois applicables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifications de la Politique de Confidentialité</h2>
              <p>
                Nous pouvons mettre à jour cette Politique de Confidentialité périodiquement. Nous vous informerons des modifications substantielles par email ou notification dans le Service. L'utilisation continue du Service après les modifications constitue l'acceptation de la nouvelle Politique de Confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact</h2>
              <p className="mb-4">
                Pour des questions sur la confidentialité ou pour exercer vos droits, contactez-nous:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">VELIKA GROUP LLC</p>
                <p className="font-semibold">Data Protection Officer</p>
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