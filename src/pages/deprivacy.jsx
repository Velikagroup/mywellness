import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DePrivacy() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Datenschutzrichtlinie</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Letzte Aktualisierung: Januar 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Einführung</h2>
              <p>
                VELIKA GROUP LLC ("wir", "unser") respektiert Ihre Privatsphäre und verpflichtet sich, Ihre personenbezogenen Daten zu schützen. Diese Datenschutzrichtlinie erklärt, wie wir Ihre Informationen sammeln, verwenden, speichern und schützen, wenn Sie MyWellness (der "Dienst") nutzen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informationen, die wir sammeln</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Von Ihnen bereitgestellte Informationen</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Registrierungsdaten:</strong> Name, Nachname, E-Mail, Passwort</li>
                <li><strong>Zahlungsdaten:</strong> Kreditkarteninformationen (sicher verarbeitet von Stripe)</li>
                <li><strong>Rechnungsdaten:</strong> Name/Firmenname, Adresse, Steuernummer/USt-IdNr., PEC/SDI</li>
                <li><strong>Kontaktdaten:</strong> Telefonnummer</li>
                <li><strong>Profildaten:</strong> Geburtsdatum, Alter, Geschlecht, Größe, Gewicht, Körpermaße</li>
                <li><strong>Zieldaten:</strong> Zielgewicht, gewünschter Körpertyp, zu verbessernde Bereiche</li>
                <li><strong>Lebensstildaten:</strong> körperliches Aktivitätsniveau, Fitnesserfahrung, Ernährungspräferenzen, Allergien</li>
                <li><strong>Fotos:</strong> von Ihnen hochgeladene Mahlzeitenbilder und Fortschrittsfotos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Automatisch gesammelte Informationen</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP-Adresse</li>
                <li>Browser- und Gerätetyp</li>
                <li>Betriebssystem</li>
                <li>Besuchte Seiten und Verweildauer</li>
                <li>Zugriffsdatum und -zeit</li>
                <li>Cookies und ähnliche Technologien</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Wie wir Ihre Informationen verwenden</h2>
              <p className="mb-3">Wir verwenden Ihre Daten um:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Den Dienst bereitzustellen und zu verbessern</li>
                <li>Personalisierte Ernährungs- und Trainingspläne zu erstellen</li>
                <li>Zahlungen zu verarbeiten und Abonnements zu verwalten</li>
                <li>Bestätigungen, Rechnungen und wichtige Mitteilungen zu senden</li>
                <li>Fortschritte zu analysieren und Feedback zu geben</li>
                <li>Unsere KI-Algorithmen zu verbessern</li>
                <li>Betrug zu verhindern und Sicherheit zu gewährleisten</li>
                <li>Auf Support-Anfragen zu antworten</li>
                <li>Marketing-Mitteilungen zu senden (nur mit Zustimmung)</li>
                <li>Gesetzliche Verpflichtungen zu erfüllen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Rechtsgrundlage der Verarbeitung (DSGVO)</h2>
              <p className="mb-3">Für Nutzer in der Europäischen Union verarbeiten wir personenbezogene Daten auf Grundlage von:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Einwilligung:</strong> für Marketing und nicht wesentliche Cookies</li>
                <li><strong>Vertragserfüllung:</strong> zur Bereitstellung des Dienstes</li>
                <li><strong>Gesetzliche Verpflichtung:</strong> für steuerliche und rechtliche Compliance</li>
                <li><strong>Berechtigtes Interesse:</strong> zur Verbesserung des Dienstes und Betrugsprävention</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Zugriff über Google (Google Sign-In)</h2>
              <p className="mb-3">
                Wenn Sie sich entscheiden, auf MyWellness über Ihr Google-Konto zuzugreifen ("Mit Google anmelden"), sammeln wir die folgenden Informationen von Ihrem Google-Profil:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Vollständiger Name:</strong> um Ihre Erfahrung zu personalisieren</li>
                <li><strong>E-Mail-Adresse:</strong> um Ihr Konto zu identifizieren und wichtige Mitteilungen zu senden</li>
                <li><strong>Profilfoto:</strong> zur Anzeige in Ihrem Konto (optional)</li>
              </ul>
              <p className="mb-3">
                <strong>Wie wir diese Daten verwenden:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Um Ihr MyWellness-Konto zu erstellen und zu verwalten</li>
                <li>Um Sie sicher zu authentifizieren, ohne ein neues Passwort erstellen zu müssen</li>
                <li>Um Ihre Erfahrung innerhalb der App zu personalisieren</li>
              </ul>
              <p className="mb-3">
                Wir greifen <strong>NICHT</strong> auf Ihre Google-Kontakte, Ihren Browserverlauf, Ihre Google Drive-Dateien oder andere Daten Ihres Google-Kontos zu. Der Zugriff ist ausschließlich auf grundlegende Profilinformationen beschränkt, die für die Authentifizierung erforderlich sind.
              </p>
              <p>
                Sie können den Zugriff von MyWellness auf Ihr Google-Konto jederzeit über die Sicherheitseinstellungen Ihres Google-Kontos widerrufen unter: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Datenweitergabe</h2>
              <p className="mb-3">Wir können Ihre Daten weitergeben an:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Dienstleister</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> zur Zahlungsabwicklung</li>
                <li><strong>Hosting-Anbieter:</strong> zur Datenspeicherung</li>
                <li><strong>E-Mail-Dienste:</strong> zum Versand von Mitteilungen</li>
                <li><strong>KI-Dienste:</strong> zur Generierung personalisierter Pläne und Fotoanalyse</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Rechtsbehörden</h3>
              <p>Wenn gesetzlich vorgeschrieben oder zum Schutz unserer Rechte.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Unternehmensübertragungen</h3>
              <p>Im Falle einer Fusion, Übernahme oder eines Vermögensverkaufs.</p>

              <p className="mt-4">Wir verkaufen Ihre personenbezogenen Daten <strong>NICHT</strong> an Dritte für Marketingzwecke.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Datensicherheit</h2>
              <p className="mb-3">Wir implementieren technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer Daten:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS-Verschlüsselung für alle Übertragungen</li>
                <li>Sichere Datenspeicherung auf geschützten Servern</li>
                <li>Begrenzter Zugriff auf personenbezogene Daten nur für autorisiertes Personal</li>
                <li>Regelmäßige Überwachung zur Erkennung von Schwachstellen</li>
                <li>Regelmäßige Datensicherungen</li>
              </ul>
              <p className="mt-4">
                Allerdings ist keine Methode der Übertragung über das Internet vollständig sicher. Wir können die absolute Sicherheit Ihrer Daten nicht garantieren.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Datenspeicherung</h2>
              <p className="mb-3">
                Wir speichern Ihre personenbezogenen Daten so lange, wie es zur Bereitstellung des Dienstes und zur Erfüllung gesetzlicher Verpflichtungen erforderlich ist:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Aktive Konten:</strong> für die Dauer des Abonnements</li>
                <li><strong>Gekündigte Konten:</strong> 90 Tage nach Kündigung (zur Ermöglichung der Reaktivierung), dann werden Daten gelöscht</li>
                <li><strong>Rechnungsdaten:</strong> 10 Jahre für steuerliche Verpflichtungen</li>
                <li><strong>Sicherheitsprotokolle:</strong> bis zu 12 Monate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Ihre Rechte</h2>
              <p className="mb-3">In Übereinstimmung mit der DSGVO und anderen Datenschutzgesetzen haben Sie folgende Rechte:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Zugang:</strong> eine Kopie Ihrer personenbezogenen Daten anfordern</li>
                <li><strong>Berichtigung:</strong> ungenaue oder unvollständige Daten korrigieren</li>
                <li><strong>Löschung:</strong> Löschung Ihrer Daten anfordern ("Recht auf Vergessenwerden")</li>
                <li><strong>Einschränkung:</strong> Verarbeitung Ihrer Daten einschränken</li>
                <li><strong>Portabilität:</strong> Ihre Daten in strukturiertem Format erhalten</li>
                <li><strong>Widerspruch:</strong> der Verarbeitung Ihrer Daten widersprechen</li>
                <li><strong>Widerruf der Einwilligung:</strong> zuvor erteilte Einwilligung widerrufen</li>
                <li><strong>Beschwerde:</strong> Beschwerde bei der Aufsichtsbehörde einreichen</li>
              </ul>
              <p className="mt-4">
                Um diese Rechte auszuüben, kontaktieren Sie uns unter: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="mb-3">
                Wir verwenden Cookies und ähnliche Technologien für:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Wesentliche Cookies:</strong> erforderlich für den Betrieb des Dienstes</li>
                <li><strong>Analytische Cookies:</strong> um zu verstehen, wie Sie den Dienst nutzen</li>
                <li><strong>Marketing-Cookies:</strong> zur Personalisierung von Anzeigen (nur mit Zustimmung)</li>
              </ul>
              <p className="mt-4">
                Sie können Cookie-Präferenzen in Ihren Browsereinstellungen verwalten.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Datenschutz für Minderjährige</h2>
              <p>
                Der Dienst ist nicht für Personen unter 18 Jahren bestimmt. Wir sammeln wissentlich keine personenbezogenen Daten von Minderjährigen unter 18 Jahren. Wenn wir feststellen, dass wir Daten von einem Minderjährigen gesammelt haben, werden wir diese umgehend löschen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Internationale Übertragungen</h2>
              <p>
                Ihre Daten können auf Server in den Vereinigten Staaten und anderen Ländern übertragen und gespeichert werden. Wir implementieren angemessene Schutzmaßnahmen, um sicherzustellen, dass Ihre Daten gemäß dieser Datenschutzrichtlinie und den geltenden Gesetzen geschützt sind.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Änderungen der Datenschutzrichtlinie</h2>
              <p>
                Wir können diese Datenschutzrichtlinie regelmäßig aktualisieren. Wir werden Sie über wesentliche Änderungen per E-Mail oder Benachrichtigung im Dienst informieren. Die fortgesetzte Nutzung des Dienstes nach Änderungen stellt die Annahme der neuen Datenschutzrichtlinie dar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Kontakt</h2>
              <p className="mb-4">
                Für Datenschutzfragen oder zur Ausübung Ihrer Rechte kontaktieren Sie uns:
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