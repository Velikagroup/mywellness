import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EnTerms() {
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
            onClick={() => navigate(createPageUrl('enhome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Terms & Conditions</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Last updated: January 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using MyWellness (the "Service"), operated by VELIKA GROUP LLC ("we", "our"), you ("you", "your") agree to be bound by these Terms and Conditions. If you do not accept these terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p>
                MyWellness provides personalized nutrition and workout plans generated through artificial intelligence. The Service includes body analysis, progress tracking, personalized recipes, and workout routines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscriptions and Payments</h2>
              <p className="mb-3">
                <strong>3.1 Trial Period:</strong> We offer a free 3-day trial period. During this period, no charges will be made. You can cancel at any time before the trial period expires.
              </p>
              <p className="mb-3">
                <strong>3.2 Automatic Renewal:</strong> At the end of the trial period, the subscription will automatically renew to the selected plan (Base, Pro, or Premium) with monthly or annual billing according to your choice.
              </p>
              <p className="mb-3">
                <strong>3.3 Pricing:</strong> Prices are indicated in Euros (€) and may vary. The applicable price is the one displayed at the time of purchase.
              </p>
              <p>
                <strong>3.4 Cancellation:</strong> You can cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Account</h2>
              <p className="mb-3">
                <strong>4.1 Registration:</strong> To use the Service, you must create an account by providing accurate and complete information.
              </p>
              <p className="mb-3">
                <strong>4.2 Security:</strong> You are responsible for the security of your account and the confidentiality of your login credentials.
              </p>
              <p>
                <strong>4.3 Minimum Age:</strong> You must be at least 18 years old to use the Service. If you are under 18, you must obtain parental or guardian consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="mb-3">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service only for personal and non-commercial purposes</li>
                <li>Provide accurate information about your health profile</li>
                <li>Not share your account with other people</li>
                <li>Not use the Service for illegal or unauthorized activities</li>
                <li>Not attempt to violate the security of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Medical Disclaimer</h2>
              <p className="mb-3">
                <strong>IMPORTANT:</strong> MyWellness does NOT provide medical advice. The nutrition and workout plans are generated by artificial intelligence and are solely for informational and educational purposes.
              </p>
              <p className="mb-3">
                Before starting any nutrition or exercise program, consult your doctor or a qualified healthcare professional, especially if you have pre-existing medical conditions, are pregnant, nursing, or taking medications.
              </p>
              <p>
                Use of the Service is at your sole risk and responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p>
                All content, software, code, design, graphics, logos, and materials present in the Service are the exclusive property of VELIKA GROUP LLC and are protected by copyright, trademarks, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="mb-3">
                To the maximum extent permitted by law, VELIKA GROUP LLC shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Direct, indirect, incidental, consequential, or punitive damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Physical injuries or health damage resulting from use of the Service</li>
                <li>Interruptions or errors in the Service</li>
                <li>Third-party content or behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account in case of violation of these Terms, without notice and without refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of Wyoming, United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
              <p>
                For questions about these Terms and Conditions, contact us:
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