import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
  bingoId: string;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  bingoId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-3 border-google-dark rounded-3xl p-6 shadow-brutal-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-google-dark flex items-center justify-center text-2xl mx-auto mb-4 shadow-brutal">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>

        <h3 className="text-xl font-black text-center text-google-dark mb-2">
          Submit Bingo Card?
        </h3>

        <div className="text-center text-xs font-mono font-bold px-3 py-1 bg-tile-yellow border-2 border-google-dark rounded-lg inline-block mx-auto mb-4">
          ID: {bingoId}
        </div>

        <p className="text-xs sm:text-sm text-google-grey text-center mb-6 leading-relaxed">
          Once you submit, your bingo card will be <strong>finalized and locked</strong> in read-only mode for organizer review.
          You won't be able to replace or remove photos after submission.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-100 text-google-dark font-bold text-xs sm:text-sm border-2 border-google-dark rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            Cancel & Review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-google-green text-white font-extrabold text-xs sm:text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-green-600 active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
