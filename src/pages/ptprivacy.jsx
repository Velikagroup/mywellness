import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PtPrivacy() {
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
            onClick={() => navigate(createPageUrl('pthome'))}
          />
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto water-glass-effect rounded-3xl p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Política de Privacidade</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Última atualização: Janeiro 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
              <p>
                VELIKA GROUP LLC ("nós", "nosso") respeita sua privacidade e se compromete a proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações quando você usa o MyWellness (o "Serviço").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Informações que Você Fornece</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados de Registro:</strong> nome, sobrenome, email, senha</li>
                <li><strong>Dados de Pagamento:</strong> informações do cartão de crédito (processadas com segurança pela Stripe)</li>
                <li><strong>Dados de Faturamento:</strong> nome/razão social, endereço, CPF/CNPJ, PEC/SDI</li>
                <li><strong>Dados de Contato:</strong> número de telefone</li>
                <li><strong>Dados de Perfil:</strong> data de nascimento, idade, gênero, altura, peso, medidas corporais</li>
                <li><strong>Dados de Objetivos:</strong> peso objetivo, tipo de corpo desejado, áreas a melhorar</li>
                <li><strong>Dados de Estilo de Vida:</strong> nível de atividade física, experiência fitness, preferências alimentares, alergias</li>
                <li><strong>Fotos:</strong> imagens de refeições e fotos de progresso enviadas por você</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Data e hora de acesso</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
              <p className="mb-3">Usamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer e melhorar o Serviço</li>
                <li>Criar planos nutricionais e de treino personalizados</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Enviar confirmações, faturas e comunicações importantes</li>
                <li>Analisar o progresso e fornecer feedback</li>
                <li>Melhorar nossos algoritmos de inteligência artificial</li>
                <li>Prevenir fraude e garantir segurança</li>
                <li>Responder a solicitações de suporte</li>
                <li>Enviar comunicações de marketing (apenas com consentimento)</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Legal do Processamento (GDPR)</h2>
              <p className="mb-3">Para usuários na União Europeia, processamos dados pessoais com base em:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentimento:</strong> para marketing e cookies não essenciais</li>
                <li><strong>Execução do Contrato:</strong> para fornecer o Serviço</li>
                <li><strong>Obrigação Legal:</strong> para conformidade fiscal e legal</li>
                <li><strong>Interesse Legítimo:</strong> para melhorar o Serviço e prevenir fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acesso via Google (Google Sign-In)</h2>
              <p className="mb-3">
                Se você escolher acessar o MyWellness usando sua conta do Google ("Entrar com Google"), coletamos as seguintes informações do seu perfil do Google:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Nome completo:</strong> para personalizar sua experiência</li>
                <li><strong>Endereço de email:</strong> para identificar sua conta e enviar comunicações importantes</li>
                <li><strong>Foto de perfil:</strong> para exibir em sua conta (opcional)</li>
              </ul>
              <p className="mb-3">
                <strong>Como usamos esses dados:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Para criar e gerenciar sua conta MyWellness</li>
                <li>Para autenticá-lo com segurança sem precisar criar uma nova senha</li>
                <li>Para personalizar sua experiência dentro do aplicativo</li>
              </ul>
              <p className="mb-3">
                <strong>NÃO</strong> acessamos seus contatos do Google, seu histórico de navegação, seus arquivos do Google Drive ou outros dados de sua conta do Google. O acesso é limitado exclusivamente às informações básicas de perfil necessárias para autenticação.
              </p>
              <p>
                Você pode revogar o acesso do MyWellness à sua conta do Google a qualquer momento nas configurações de segurança da sua conta do Google em: <a href="https://myaccount.google.com/permissions" className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">https://myaccount.google.com/permissions</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Compartilhamento de Dados</h2>
              <p className="mb-3">Podemos compartilhar seus dados com:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Provedores de Serviços</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> para processamento de pagamentos</li>
                <li><strong>Provedores de Hospedagem:</strong> para armazenar dados</li>
                <li><strong>Serviços de Email:</strong> para enviar comunicações</li>
                <li><strong>Serviços de IA:</strong> para gerar planos personalizados e analisar fotos</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Autoridades Legais</h3>
              <p>Quando exigido por lei ou para proteger nossos direitos.</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Transferências Empresariais</h3>
              <p>Em caso de fusão, aquisição ou venda de ativos.</p>

              <p className="mt-4"><strong>NÃO</strong> vendemos seus dados pessoais a terceiros para fins de marketing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Segurança de Dados</h2>
              <p className="mb-3">Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criptografia SSL/TLS para todas as transmissões</li>
                <li>Armazenamento seguro de dados em servidores protegidos</li>
                <li>Acesso limitado a dados pessoais apenas por pessoal autorizado</li>
                <li>Monitoramento regular para detectar vulnerabilidades</li>
                <li>Backups regulares de dados</li>
              </ul>
              <p className="mt-4">
                No entanto, nenhum método de transmissão pela Internet é completamente seguro. Não podemos garantir a segurança absoluta de seus dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retenção de Dados</h2>
              <p className="mb-3">
                Retemos seus dados pessoais pelo tempo necessário para fornecer o Serviço e cumprir obrigações legais:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contas Ativas:</strong> durante toda a duração da assinatura</li>
                <li><strong>Contas Canceladas:</strong> 90 dias após o cancelamento (para permitir reativação), depois os dados são excluídos</li>
                <li><strong>Dados de Faturamento:</strong> 10 anos por obrigações fiscais</li>
                <li><strong>Logs de Segurança:</strong> até 12 meses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Seus Direitos</h2>
              <p className="mb-3">De acordo com o GDPR e outras leis de privacidade, você tem os seguintes direitos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acesso:</strong> solicitar uma cópia de seus dados pessoais</li>
                <li><strong>Retificação:</strong> corrigir dados imprecisos ou incompletos</li>
                <li><strong>Exclusão:</strong> solicitar a exclusão de seus dados ("direito ao esquecimento")</li>
                <li><strong>Limitação:</strong> limitar o processamento de seus dados</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong>Oposição:</strong> opor-se ao processamento de seus dados</li>
                <li><strong>Retirada de Consentimento:</strong> retirar o consentimento previamente dado</li>
                <li><strong>Reclamação:</strong> apresentar reclamação à autoridade supervisora</li>
              </ul>
              <p className="mt-4">
                Para exercer esses direitos, entre em contato: velika.03@outlook.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="mb-3">
                Usamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies Essenciais:</strong> necessários para o funcionamento do Serviço</li>
                <li><strong>Cookies Analíticos:</strong> para entender como você usa o Serviço</li>
                <li><strong>Cookies de Marketing:</strong> para personalizar anúncios (apenas com consentimento)</li>
              </ul>
              <p className="mt-4">
                Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacidade de Menores</h2>
              <p>
                O Serviço não é destinado a menores de 18 anos. Não coletamos conscientemente dados pessoais de menores de 18 anos. Se descobrirmos que coletamos dados de um menor, os excluiremos imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Transferências Internacionais</h2>
              <p>
                Seus dados podem ser transferidos e armazenados em servidores nos Estados Unidos e outros países. Implementamos salvaguardas apropriadas para garantir que seus dados sejam protegidos de acordo com esta Política de Privacidade e leis aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Alterações na Política de Privacidade</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Informaremos sobre mudanças substanciais por email ou notificação no Serviço. O uso continuado do Serviço após as mudanças constitui aceitação da nova Política de Privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contato</h2>
              <p className="mb-4">
                Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
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