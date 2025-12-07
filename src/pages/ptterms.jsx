import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PtTerms() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Termos e Condições</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Última atualização: Janeiro 2025</p>

          <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o MyWellness (o "Serviço"), operado pela VELIKA GROUP LLC ("nós", "nosso"), você ("você", "seu") concorda em estar vinculado a estes Termos e Condições. Se você não aceita estes termos, não use o Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p>
                MyWellness fornece planos nutricionais e de treino personalizados gerados por inteligência artificial. O Serviço inclui análise corporal, acompanhamento de progresso, receitas personalizadas e rotinas de treino.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Assinaturas e Pagamentos</h2>
              <p className="mb-3">
                <strong>3.1 Período de Teste:</strong> Oferecemos um período de teste gratuito de 3 dias. Durante este período, não serão feitas cobranças. Você pode cancelar a qualquer momento antes do término do período de teste.
              </p>
              <p className="mb-3">
                <strong>3.2 Renovação Automática:</strong> Ao término do período de teste, a assinatura será renovada automaticamente para o plano selecionado (Base, Pro ou Premium) com faturamento mensal ou anual conforme sua escolha.
              </p>
              <p className="mb-3">
                <strong>3.3 Preços:</strong> Os preços são indicados em Euros (€) e podem variar. O preço aplicável é aquele exibido no momento da compra.
              </p>
              <p>
                <strong>3.4 Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. O cancelamento terá efeito no final do período de faturamento atual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Conta de Usuário</h2>
              <p className="mb-3">
                <strong>4.1 Registro:</strong> Para usar o Serviço, você deve criar uma conta fornecendo informações precisas e completas.
              </p>
              <p className="mb-3">
                <strong>4.2 Segurança:</strong> Você é responsável pela segurança de sua conta e pela confidencialidade de suas credenciais de acesso.
              </p>
              <p>
                <strong>4.3 Idade Mínima:</strong> Você deve ter pelo menos 18 anos para usar o Serviço. Se você tiver menos de 18 anos, deve obter o consentimento de um pai ou responsável.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Aceitável</h2>
              <p className="mb-3">Você concorda em:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar o Serviço apenas para fins pessoais e não comerciais</li>
                <li>Fornecer informações precisas sobre seu perfil de saúde</li>
                <li>Não compartilhar sua conta com outras pessoas</li>
                <li>Não usar o Serviço para atividades ilegais ou não autorizadas</li>
                <li>Não tentar violar a segurança do Serviço</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Isenção de Responsabilidade Médica</h2>
              <p className="mb-3">
                <strong>IMPORTANTE:</strong> MyWellness NÃO fornece aconselhamento médico. Os planos nutricionais e de treino são gerados por inteligência artificial e têm exclusivamente fins informativos e educacionais.
              </p>
              <p className="mb-3">
                Antes de iniciar qualquer programa nutricional ou de exercícios físicos, consulte seu médico ou um profissional de saúde qualificado, especialmente se você tem condições médicas preexistentes, está grávida, amamentando ou tomando medicamentos.
              </p>
              <p>
                O uso do Serviço é por sua exclusiva conta e risco.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, software, código, design, gráficos, logotipos e materiais presentes no Serviço são propriedade exclusiva da VELIKA GROUP LLC e são protegidos por direitos autorais, marcas registradas e outras leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitação de Responsabilidade</h2>
              <p className="mb-3">
                Na máxima extensão permitida pela lei, VELIKA GROUP LLC não será responsável por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Danos diretos, indiretos, incidentais, consequenciais ou punitivos</li>
                <li>Perda de lucros, dados ou oportunidades comerciais</li>
                <li>Lesões físicas ou danos à saúde decorrentes do uso do Serviço</li>
                <li>Interrupções ou erros no Serviço</li>
                <li>Conteúdo ou comportamento de terceiros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificações aos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes Termos e Condições a qualquer momento. As modificações serão efetivas imediatamente após a publicação. O uso continuado do Serviço após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Rescisão</h2>
              <p>
                Reservamo-nos o direito de suspender ou encerrar sua conta em caso de violação destes Termos, sem aviso prévio e sem reembolso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Lei Aplicável</h2>
              <p>
                Estes Termos são regidos pelas leis do Estado de Wyoming, Estados Unidos, sem considerar os princípios de conflito de leis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contato</h2>
              <p>
                Para perguntas sobre estes Termos e Condições, entre em contato:
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