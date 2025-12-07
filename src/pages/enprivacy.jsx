import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EnPrivacy() {
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
            onClick={() => navigate(createPageUrl('enhome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Last updated: January 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                VELIKA GROUP LLC ("we", "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use MyWellness (the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Registration Data:</strong> name, surname, email, password</li>
                <li><strong>Payment Data:</strong> credit card information (securely processed by Stripe)</li>
                <li><strong>Billing Data:</strong> name/company name, address, tax ID/VAT, PEC/SDI</li>
                <li><strong>Contact Data:</strong> phone number</li>
                <li><strong>Profile Data:</strong> date of birth, age, gender, height, weight, body measurements</li>
                <li><strong>Goals Data:</strong> target weight, desired body type, areas to improve</li>
                <li><strong>Lifestyle Data:</strong> physical activity level, fitness experience, dietary preferences, allergies</li>
                <li><strong>Photos:</strong> meal images and progress photos uploaded by you</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address</li>
                <li>Browser and device type</li>
                <li>Operating system</li>
                <li>Pages visited and time spent</li>
                <li>Access date and time</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="mb-3">We use your data to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve the Service</li>
                <li>Create personalized nutrition and workout plans</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send confirmations, invoices, and important communications</li>
                <li>Analyze progress and provide feedback</li>
                <li>Improve our artificial intelligence algorithms</li>
                <li>Prevent fraud and ensure security</li>
                <li>Respond to support requests</li>
                <li>Send marketing communications (only with consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Legal Basis for Processing (GDPR)</h2>
              <p className="mb-3">For users in the European Union, we process personal data based on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consent:</strong> for marketing and non-essential cookies</li>
                <li><strong>Contract Performance:</strong> to provide the Service</li>
                <li><strong>Legal Obligation:</strong> for tax and legal compliance</li>
                <li><strong>Legitimate Interest:</strong> to improve the Service and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Google Sign-In Access</h2>
              <p className="mb-3">
                If you choose to access MyWellness using your Google account ("Sign in with Google"), we collect the following information from your Google profile:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Full name:</strong> to personalize your experience</li>
                <li><strong>Email address:</strong> to identify your account and send important communications</li>
                <li><strong>Profile photo:</strong> to display in your account (optional)</li>
              </ul>
              <p className="mb-3">
                <strong>How we use this data:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>To create and manage your MyWellness account</li>
                <li>To authenticate you securely without creating a new password</li>
                <li>To personalize your experience within the app</li>
              </ul>
              <p className="mb-3">
                We do <strong>NOT</strong> access your Google contacts, browsing history, Google Drive files, or other data from your Google account. Access is limited exclusively to basic profile information needed for authentication.
              </p>
              <p>
                You can revoke MyWellness access to your Google account at any time from your Google account security settings at: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing</h2>
              <p className="mb-3">We may share your data with:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> for payment processing</li>
                <li><strong>Hosting Providers:</strong> to store data</li>
                <li><strong>Email Services:</strong> to send communications</li>
                <li><strong>AI Services:</strong> to generate personalized plans and analyze photos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Legal Authorities</h3>
              <p>When required by law or to protect our rights.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Business Transfers</h3>
              <p>In case of merger, acquisition, or asset sale.</p>

              <p className="mt-4">We do <strong>NOT</strong> sell your personal data to third parties for marketing purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
              <p className="mb-3">We implement technical and organizational security measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS encryption for all transmissions</li>
                <li>Secure data storage on protected servers</li>
                <li>Limited access to personal data only by authorized personnel</li>
                <li>Regular monitoring to detect vulnerabilities</li>
                <li>Regular data backups</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet is completely secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="mb-3">
                We retain your personal data for as long as necessary to provide the Service and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Active Accounts:</strong> for the duration of the subscription</li>
                <li><strong>Cancelled Accounts:</strong> 90 days after cancellation (to allow reactivation), then data is deleted</li>
                <li><strong>Billing Data:</strong> 10 years for tax obligations</li>
                <li><strong>Security Logs:</strong> up to 12 months</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights</h2>
              <p className="mb-3">In accordance with GDPR and other privacy laws, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> request a copy of your personal data</li>
                <li><strong>Rectification:</strong> correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> request deletion of your data ("right to be forgotten")</li>
                <li><strong>Restriction:</strong> limit processing of your data</li>
                <li><strong>Portability:</strong> receive your data in structured format</li>
                <li><strong>Objection:</strong> object to processing of your data</li>
                <li><strong>Consent Withdrawal:</strong> withdraw previously given consent</li>
                <li><strong>Complaint:</strong> file a complaint with supervisory authority</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="mb-3">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> necessary for Service operation</li>
                <li><strong>Analytics Cookies:</strong> to understand how you use the Service</li>
                <li><strong>Marketing Cookies:</strong> to personalize ads (only with consent)</li>
              </ul>
              <p className="mt-4">
                You can manage cookie preferences in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p>
                The Service is not intended for individuals under 18 years old. We do not knowingly collect personal data from minors under 18. If we discover we have collected data from a minor, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. International Transfers</h2>
              <p>
                Your data may be transferred and stored on servers in the United States and other countries. We implement appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will inform you of substantial changes via email or notification in the Service. Continued use of the Service after changes constitutes acceptance of the new Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact</h2>
              <p className="mb-4">
                For privacy questions or to exercise your rights, contact us:
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