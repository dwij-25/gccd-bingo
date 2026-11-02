import React from 'react';
import { X, BookOpen, CheckCircle2, Award, Camera, ShieldAlert } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white border-2 sm:border-3 border-google-dark rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-brutal sm:shadow-brutal-lg relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-google-dark" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-google-blue/10 border-2 border-google-blue mx-auto mb-3 flex items-center justify-center text-google-blue shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-google-dark tracking-tight">
            Rules & Regulations
          </h3>
          <p className="text-xs text-google-grey mt-1">
            Google Cloud Developer Community Day (GCCD) Official Photo Bingo
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-google-dark">
          {/* Section 1 */}
          <div className="p-3.5 bg-gray-50 border-2 border-google-dark rounded-2xl">
            <h4 className="font-extrabold text-sm mb-1.5 flex items-center gap-2 text-google-blue">
              <Camera className="w-4 h-4" /> 1. Completing Challenges
            </h4>
            <p className="text-xs text-google-grey leading-relaxed">
              Click or tap any of the 9 tiles to flip the card and read its challenge description. Click the picture in real time at the event using your camera and adjust it. Photos are compressed client-side for fast loading.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 bg-gray-50 border-2 border-google-dark rounded-2xl">
            <h4 className="font-extrabold text-sm mb-1.5 flex items-center gap-2 text-google-green">
              <CheckCircle2 className="w-4 h-4" /> 2. Signal Status Indicators
            </h4>
            <ul className="text-xs space-y-1.5 text-google-grey">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-google-red border border-google-dark inline-block flex-shrink-0" />
                <span><strong>Red Dot</strong> = Challenge not finished yet.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-google-green border border-google-dark inline-block flex-shrink-0" />
                <span><strong>Green Dot</strong> = Challenge photo verified and completed.</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 bg-gray-50 border-2 border-google-dark rounded-2xl">
            <h4 className="font-extrabold text-sm mb-1.5 flex items-center gap-2 text-google-yellow">
              <Award className="w-4 h-4" /> 3. Winning Line Combinations
            </h4>
            <p className="text-xs text-google-grey leading-relaxed mb-2">
              Qualify for prize tiers by connecting 3 green tiles in a row:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-google-dark">
              <div className="p-2 bg-white border border-gray-300 rounded-xl">
                • 3 Horizontal Rows
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded-xl">
                • 3 Vertical Columns
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded-xl">
                • 2 Main Diagonals
              </div>
              <div className="p-2 bg-white border border-gray-300 rounded-xl text-google-green font-bold">
                • Full Card: 9/9 Complete
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 bg-gray-50 border-2 border-google-dark rounded-2xl">
            <h4 className="font-extrabold text-sm mb-1.5 flex items-center gap-2 text-google-red">
              <ShieldAlert className="w-4 h-4" /> 4. Submitting & Verification
            </h4>
            <p className="text-xs text-google-grey leading-relaxed">
              The <strong>SUBMIT</strong> button activates once all 9 boxes turn green. Submitting generates your official, tamper-proof <strong>Bingo ID</strong> and permanently locks the card. You can then download your customized high-resolution A4 Bingo card and visit the GCCD Swag Desk to claim your prizes!
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-google-blue text-white font-extrabold text-sm border-2 border-google-dark rounded-xl shadow-brutal hover:bg-blue-600 active:shadow-none transition cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
