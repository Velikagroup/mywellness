import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function DeleteExerciseDialog({ 
  isOpen, 
  onClose, 
  exercise,
  onConfirm,
  isDeleting = false
}) {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
            {t('workouts.deleteExerciseTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('workouts.deleteExerciseDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-gray-800">{exercise?.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {exercise?.sets} {t('workouts.setsLabel')} × {exercise?.reps}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {t('workouts.deleteWarning')}
          </p>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('workouts.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}