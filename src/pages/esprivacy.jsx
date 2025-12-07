import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EsPrivacy() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Política de Privacidad</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Última actualización: Enero 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introducción</h2>
              <p>
                VELIKA GROUP LLC ("nosotros", "nuestro") respeta su privacidad y se compromete a proteger sus datos personales. Esta Política de Privacidad explica cómo recopilamos, utilizamos, almacenamos y protegemos su información cuando utiliza MyWellness (el "Servicio").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Información que Usted Proporciona</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos de Registro:</strong> nombre, apellido, email, contraseña</li>
                <li><strong>Datos de Pago:</strong> información de tarjeta de crédito (procesada de forma segura por Stripe)</li>
                <li><strong>Datos de Facturación:</strong> nombre/razón social, dirección, NIF/CIF, PEC/SDI</li>
                <li><strong>Datos de Contacto:</strong> número de teléfono</li>
                <li><strong>Datos de Perfil:</strong> fecha de nacimiento, edad, género, altura, peso, medidas corporales</li>
                <li><strong>Datos de Objetivos:</strong> peso objetivo, tipo de cuerpo deseado, áreas a mejorar</li>
                <li><strong>Datos de Estilo de Vida:</strong> nivel de actividad física, experiencia fitness, preferencias alimentarias, alergias</li>
                <li><strong>Fotos:</strong> imágenes de comidas y fotos de progreso cargadas por usted</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Información Recopilada Automáticamente</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Sistema operativo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Fecha y hora de acceso</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cómo Utilizamos su Información</h2>
              <p className="mb-3">Utilizamos sus datos para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar y mejorar el Servicio</li>
                <li>Crear planes nutricionales y de entrenamiento personalizados</li>
                <li>Procesar pagos y gestionar suscripciones</li>
                <li>Enviar confirmaciones, facturas y comunicaciones importantes</li>
                <li>Analizar el progreso y proporcionar retroalimentación</li>
                <li>Mejorar nuestros algoritmos de inteligencia artificial</li>
                <li>Prevenir fraude y garantizar la seguridad</li>
                <li>Responder a solicitudes de soporte</li>
                <li>Enviar comunicaciones de marketing (solo con consentimiento)</li>
                <li>Cumplir obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Legal del Tratamiento (GDPR)</h2>
              <p className="mb-3">Para usuarios en la Unión Europea, procesamos datos personales con base en:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentimiento:</strong> para marketing y cookies no esenciales</li>
                <li><strong>Ejecución del Contrato:</strong> para proporcionar el Servicio</li>
                <li><strong>Obligación Legal:</strong> para cumplimiento fiscal y legal</li>
                <li><strong>Interés Legítimo:</strong> para mejorar el Servicio y prevenir fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceso mediante Google (Google Sign-In)</h2>
              <p className="mb-3">
                Si elige acceder a MyWellness utilizando su cuenta de Google ("Iniciar sesión con Google"), recopilamos la siguiente información de su perfil de Google:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Nombre completo:</strong> para personalizar su experiencia</li>
                <li><strong>Dirección de email:</strong> para identificar su cuenta y enviar comunicaciones importantes</li>
                <li><strong>Foto de perfil:</strong> para mostrarla en su cuenta (opcional)</li>
              </ul>
              <p className="mb-3">
                <strong>Cómo utilizamos estos datos:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Para crear y gestionar su cuenta MyWellness</li>
                <li>Para autenticarlo de forma segura sin necesidad de crear una nueva contraseña</li>
                <li>Para personalizar su experiencia dentro de la aplicación</li>
              </ul>
              <p className="mb-3">
                <strong>NO</strong> accedemos a sus contactos de Google, su historial de navegación, sus archivos de Google Drive u otros datos de su cuenta de Google. El acceso está limitado exclusivamente a la información de perfil básica necesaria para la autenticación.
              </p>
              <p>
                Puede revocar el acceso de MyWellness a su cuenta de Google en cualquier momento desde la configuración de seguridad de su cuenta de Google en: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Compartir Datos</h2>
              <p className="mb-3">Podemos compartir sus datos con:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Proveedores de Servicios</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> para procesamiento de pagos</li>
                <li><strong>Proveedores de Hosting:</strong> para almacenar datos</li>
                <li><strong>Servicios de Email:</strong> para enviar comunicaciones</li>
                <li><strong>Servicios de IA:</strong> para generar planes personalizados y analizar fotos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Autoridades Legales</h3>
              <p>Cuando lo requiera la ley o para proteger nuestros derechos.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Transferencias Empresariales</h3>
              <p>En caso de fusión, adquisición o venta de activos.</p>

              <p className="mt-4"><strong>NO</strong> vendemos sus datos personales a terceros con fines de marketing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seguridad de Datos</h2>
              <p className="mb-3">Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cifrado SSL/TLS para todas las transmisiones</li>
                <li>Almacenamiento seguro de datos en servidores protegidos</li>
                <li>Acceso limitado a datos personales solo por personal autorizado</li>
                <li>Monitoreo regular para detectar vulnerabilidades</li>
                <li>Copias de seguridad regulares de datos</li>
              </ul>
              <p className="mt-4">
                Sin embargo, ningún método de transmisión por Internet es completamente seguro. No podemos garantizar la seguridad absoluta de sus datos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retención de Datos</h2>
              <p className="mb-3">
                Conservamos sus datos personales durante el tiempo necesario para proporcionar el Servicio y cumplir con obligaciones legales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cuentas Activas:</strong> durante toda la duración de la suscripción</li>
                <li><strong>Cuentas Canceladas:</strong> 90 días después de la cancelación (para permitir reactivación), luego se eliminan los datos</li>
                <li><strong>Datos de Facturación:</strong> 10 años por obligaciones fiscales</li>
                <li><strong>Registros de Seguridad:</strong> hasta 12 meses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Sus Derechos</h2>
              <p className="mb-3">De acuerdo con el GDPR y otras leyes de privacidad, tiene los siguientes derechos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> solicitar una copia de sus datos personales</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de sus datos ("derecho al olvido")</li>
                <li><strong>Limitación:</strong> limitar el procesamiento de sus datos</li>
                <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> oponerse al procesamiento de sus datos</li>
                <li><strong>Retirada del Consentimiento:</strong> retirar el consentimiento previamente otorgado</li>
                <li><strong>Reclamación:</strong> presentar una reclamación ante la autoridad de control</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, contáctenos en: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="mb-3">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies Esenciales:</strong> necesarias para el funcionamiento del Servicio</li>
                <li><strong>Cookies Analíticas:</strong> para entender cómo usa el Servicio</li>
                <li><strong>Cookies de Marketing:</strong> para personalizar anuncios (solo con consentimiento)</li>
              </ul>
              <p className="mt-4">
                Puede gestionar las preferencias de cookies en la configuración de su navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacidad de Menores</h2>
              <p>
                El Servicio no está destinado a menores de 18 años. No recopilamos conscientemente datos personales de menores de 18 años. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Transferencias Internacionales</h2>
              <p>
                Sus datos pueden ser transferidos y almacenados en servidores en Estados Unidos y otros países. Implementamos salvaguardias apropiadas para garantizar que sus datos estén protegidos de acuerdo con esta Política de Privacidad y las leyes aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Cambios en la Política de Privacidad</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Le informaremos de cambios sustanciales por email o notificación en el Servicio. El uso continuado del Servicio después de los cambios constituye aceptación de la nueva Política de Privacidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contacto</h2>
              <p className="mb-4">
                Para preguntas sobre privacidad o para ejercer sus derechos, contáctenos:
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