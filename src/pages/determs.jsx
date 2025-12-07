import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DeTerms() {
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
            onClick={() => navigate(createPageUrl('dehome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Letzte Aktualisierung: Januar 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Annahme der Bedingungen</h2>
              <p>
                Durch den Zugriff auf und die Nutzung von MyWellness (der "Dienst"), betrieben von VELIKA GROUP LLC ("wir", "unser"), stimmen Sie ("Sie", "Ihr") zu, an diese Allgemeinen Geschäftsbedingungen gebunden zu sein. Wenn Sie diese Bedingungen nicht akzeptieren, nutzen Sie den Dienst nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Beschreibung des Dienstes</h2>
              <p>
                MyWellness bietet personalisierte Ernährungs- und Trainingspläne, die durch künstliche Intelligenz generiert werden. Der Dienst umfasst Körperanalyse, Fortschrittsverfolgung, personalisierte Rezepte und Trainingsroutinen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Abonnements und Zahlungen</h2>
              <p className="mb-3">
                <strong>3.1 Testzeitraum:</strong> Wir bieten einen kostenlosen 3-tägigen Testzeitraum an. Während dieses Zeitraums fallen keine Gebühren an. Sie können jederzeit vor Ablauf des Testzeitraums kündigen.
              </p>
              <p className="mb-3">
                <strong>3.2 Automatische Verlängerung:</strong> Am Ende des Testzeitraums wird das Abonnement automatisch auf den gewählten Plan (Base, Pro oder Premium) mit monatlicher oder jährlicher Abrechnung gemäß Ihrer Wahl verlängert.
              </p>
              <p className="mb-3">
                <strong>3.3 Preise:</strong> Die Preise werden in Euro (€) angegeben und können variieren. Der anwendbare Preis ist der zum Zeitpunkt des Kaufs angezeigte.
              </p>
              <p>
                <strong>3.4 Kündigung:</strong> Sie können Ihr Abonnement jederzeit über Ihre Kontoeinstellungen kündigen. Die Kündigung wird am Ende des aktuellen Abrechnungszeitraums wirksam.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Benutzerkonto</h2>
              <p className="mb-3">
                <strong>4.1 Registrierung:</strong> Um den Dienst zu nutzen, müssen Sie ein Konto erstellen und genaue und vollständige Informationen angeben.
              </p>
              <p className="mb-3">
                <strong>4.2 Sicherheit:</strong> Sie sind für die Sicherheit Ihres Kontos und die Vertraulichkeit Ihrer Anmeldedaten verantwortlich.
              </p>
              <p>
                <strong>4.3 Mindestalter:</strong> Sie müssen mindestens 18 Jahre alt sein, um den Dienst zu nutzen. Wenn Sie unter 18 Jahre alt sind, müssen Sie die Zustimmung eines Elternteils oder Erziehungsberechtigten einholen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Akzeptable Nutzung</h2>
              <p className="mb-3">Sie verpflichten sich:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Den Dienst nur für persönliche und nicht kommerzielle Zwecke zu nutzen</li>
                <li>Genaue Informationen über Ihr Gesundheitsprofil bereitzustellen</li>
                <li>Ihr Konto nicht mit anderen Personen zu teilen</li>
                <li>Den Dienst nicht für illegale oder nicht autorisierte Aktivitäten zu verwenden</li>
                <li>Nicht zu versuchen, die Sicherheit des Dienstes zu verletzen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Medizinischer Haftungsausschluss</h2>
              <p className="mb-3">
                <strong>WICHTIG:</strong> MyWellness bietet KEINE medizinische Beratung. Die Ernährungs- und Trainingspläne werden von künstlicher Intelligenz generiert und dienen ausschließlich Informations- und Bildungszwecken.
              </p>
              <p className="mb-3">
                Bevor Sie ein Ernährungs- oder Trainingsprogramm beginnen, konsultieren Sie Ihren Arzt oder einen qualifizierten Gesundheitsfachmann, insbesondere wenn Sie bereits bestehende medizinische Erkrankungen haben, schwanger sind, stillen oder Medikamente einnehmen.
              </p>
              <p>
                Die Nutzung des Dienstes erfolgt auf Ihr alleiniges Risiko und Ihre Verantwortung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Geistiges Eigentum</h2>
              <p>
                Alle Inhalte, Software, Code, Design, Grafiken, Logos und Materialien im Dienst sind ausschließliches Eigentum von VELIKA GROUP LLC und durch Urheberrechte, Marken und andere Gesetze zum Schutz des geistigen Eigentums geschützt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Haftungsbeschränkung</h2>
              <p className="mb-3">
                Im gesetzlich maximal zulässigen Umfang haftet VELIKA GROUP LLC nicht für:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Direkte, indirekte, zufällige, Folge- oder Strafschäden</li>
                <li>Verlust von Gewinnen, Daten oder Geschäftsmöglichkeiten</li>
                <li>Körperliche Verletzungen oder Gesundheitsschäden durch Nutzung des Dienstes</li>
                <li>Unterbrechungen oder Fehler im Dienst</li>
                <li>Inhalte oder Verhalten Dritter</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Änderungen der Bedingungen</h2>
              <p>
                Wir behalten uns das Recht vor, diese Allgemeinen Geschäftsbedingungen jederzeit zu ändern. Änderungen werden unmittelbar nach Veröffentlichung wirksam. Die fortgesetzte Nutzung des Dienstes nach Änderungen stellt die Annahme der neuen Bedingungen dar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Kündigung</h2>
              <p>
                Wir behalten uns das Recht vor, Ihr Konto im Falle eines Verstoßes gegen diese Bedingungen ohne Vorankündigung und ohne Rückerstattung zu sperren oder zu kündigen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Anwendbares Recht</h2>
              <p>
                Diese Bedingungen unterliegen den Gesetzen des Staates Wyoming, Vereinigte Staaten, ohne Berücksichtigung der Grundsätze des Kollisionsrechts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Kontakt</h2>
              <p>
                Für Fragen zu diesen Allgemeinen Geschäftsbedingungen kontaktieren Sie uns:
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