import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteExerciseDialog({ 
  isOpen, 
  onClose, 
  exercise,
  onConfirm,
  isDeleting = false
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Elimina Esercizio
          </DialogTitle>
          <DialogDescription>
            Sei sicuro di voler eliminare questo esercizio dal tuo piano di allenamento?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-gray-800">{exercise?.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {exercise?.sets} serie × {exercise?.reps}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Questa azione non può essere annullata. Puoi sempre aggiungere un nuovo esercizio in seguito.
          </p>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}