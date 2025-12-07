import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EsTerms() {
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
            onClick={() => navigate(createPageUrl('eshome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Términos y Condiciones</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Última actualización: Enero 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar MyWellness (el "Servicio"), operado por VELIKA GROUP LLC ("nosotros", "nuestro"), usted ("usted", "su") acepta estar vinculado por estos Términos y Condiciones. Si no acepta estos términos, no utilice el Servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p>
                MyWellness proporciona planes nutricionales y de entrenamiento personalizados generados mediante inteligencia artificial. El Servicio incluye análisis corporal, seguimiento de progreso, recetas personalizadas y rutinas de entrenamiento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Suscripciones y Pagos</h2>
              <p className="mb-3">
                <strong>3.1 Período de Prueba:</strong> Ofrecemos un período de prueba gratuito de 3 días. Durante este período, no se realizarán cargos. Puede cancelar en cualquier momento antes de que expire el período de prueba.
              </p>
              <p className="mb-3">
                <strong>3.2 Renovación Automática:</strong> Al finalizar el período de prueba, la suscripción se renovará automáticamente al plan seleccionado (Base, Pro o Premium) con facturación mensual o anual según su elección.
              </p>
              <p className="mb-3">
                <strong>3.3 Precios:</strong> Los precios se indican en Euros (€) y pueden variar. El precio aplicable es el que se muestra en el momento de la compra.
              </p>
              <p>
                <strong>3.4 Cancelación:</strong> Puede cancelar su suscripción en cualquier momento a través de la configuración de su cuenta. La cancelación tendrá efecto al final del período de facturación actual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cuenta de Usuario</h2>
              <p className="mb-3">
                <strong>4.1 Registro:</strong> Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa y completa.
              </p>
              <p className="mb-3">
                <strong>4.2 Seguridad:</strong> Usted es responsable de la seguridad de su cuenta y de la confidencialidad de sus credenciales de acceso.
              </p>
              <p>
                <strong>4.3 Edad Mínima:</strong> Debe tener al menos 18 años para utilizar el Servicio. Si tiene menos de 18 años, debe obtener el consentimiento de un padre o tutor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Aceptable</h2>
              <p className="mb-3">Usted se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizar el Servicio solo para fines personales y no comerciales</li>
                <li>Proporcionar información precisa sobre su perfil de salud</li>
                <li>No compartir su cuenta con otras personas</li>
                <li>No utilizar el Servicio para actividades ilegales o no autorizadas</li>
                <li>No intentar violar la seguridad del Servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Descargo de Responsabilidad Médica</h2>
              <p className="mb-3">
                <strong>IMPORTANTE:</strong> MyWellness NO proporciona asesoramiento médico. Los planes nutricionales y de entrenamiento son generados por inteligencia artificial y tienen únicamente fines informativos y educativos.
              </p>
              <p className="mb-3">
                Antes de comenzar cualquier programa nutricional o de ejercicio físico, consulte a su médico o a un profesional de la salud calificado, especialmente si tiene condiciones médicas preexistentes, está embarazada, amamantando o tomando medicamentos.
              </p>
              <p>
                El uso del Servicio es bajo su exclusivo riesgo y responsabilidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propiedad Intelectual</h2>
              <p>
                Todo el contenido, software, código, diseño, gráficos, logotipos y materiales presentes en el Servicio son propiedad exclusiva de VELIKA GROUP LLC y están protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitación de Responsabilidad</h2>
              <p className="mb-3">
                En la máxima medida permitida por la ley, VELIKA GROUP LLC no será responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Daños directos, indirectos, incidentales, consecuenciales o punitivos</li>
                <li>Pérdida de beneficios, datos u oportunidades comerciales</li>
                <li>Lesiones físicas o daños a la salud derivados del uso del Servicio</li>
                <li>Interrupciones o errores en el Servicio</li>
                <li>Contenido o comportamiento de terceros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificaciones a los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación. El uso continuado del Servicio después de las modificaciones constituye la aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Resolución</h2>
              <p>
                Nos reservamos el derecho de suspender o terminar su cuenta en caso de violación de estos Términos, sin previo aviso y sin reembolso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ley Aplicable</h2>
              <p>
                Estos Términos se rigen por las leyes del Estado de Wyoming, Estados Unidos, sin tener en cuenta los principios de conflicto de leyes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contacto</h2>
              <p>
                Para preguntas sobre estos Términos y Condiciones, contáctenos:
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