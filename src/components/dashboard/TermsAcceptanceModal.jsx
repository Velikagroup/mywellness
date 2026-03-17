import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Shield } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function TermsAcceptanceModal({ isOpen, onAccept }) {
  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-[520px] [&>button]:hidden max-h-[90vh] md:max-h-full overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="space-y-3 md:space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Benvenuto su MyWellness
            </h2>
            <p className="text-sm text-gray-600">
              Abbiamo aggiornato i nostri Termini di Servizio e Privacy Policy
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Per continuare a utilizzare MyWellness, ti preghiamo di leggere e accettare le nostre policy aggiornate:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Termini di Servizio</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    I nostri Termini di Servizio delineano le regole e normative per l'utilizzo della piattaforma MyWellness, inclusi diritti, responsabilità e limitazioni.
                  </p>
                  <a 
                    href="https://projectmywellness.com/terms" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Leggi i Termini di Servizio →
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Privacy Policy</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    La nostra Privacy Policy spiega come raccogliamo, usiamo, proteggiamo e condividiamo le tue informazioni personali quando utilizzi i nostri servizi.
                  </p>
                  <a 
                    href="https://projectmywellness.com/privacy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Leggi la Privacy Policy →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Importante:</span> Cliccando su "Accetto", confermi di aver letto, compreso e accettato di essere vincolato dai nostri Termini di Servizio e dalla Privacy Policy.
              </p>
            </div>
          </div>

          <Button 
            onClick={onAccept}
            className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white py-6 text-base font-semibold"
          >
            Accetto
          </Button>

          <p className="text-center text-xs text-gray-500">
            Devi accettare questi termini per continuare a utilizzare MyWellness
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}