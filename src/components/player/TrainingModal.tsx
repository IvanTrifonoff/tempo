import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrainingSettings } from '../../types';

interface TrainingModalProps {
    show: boolean;
    onClose: () => void;
    training: TrainingSettings;
    setTraining: React.Dispatch<React.SetStateAction<TrainingSettings>>;
}

const TrainingModal: React.FC<TrainingModalProps> = ({ show, onClose, training, setTraining }) => {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 transition-all">
            <div className="bg-[#1a1a1a] border border-white/10 p-6 md:p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85dvh]">
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h2 className="text-2xl font-serif text-white font-bold mb-1">{t('coach.title') || 'Coach Mode'}</h2>
                        <p className="text-gray-500 text-sm font-medium">{t('coach.subtitle') || 'Training Assistant'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
                </div>
                <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2 pb-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h4 className="text-white font-bold text-lg">{t('coach.autopilot')}</h4>
                                <p className="text-xs text-gray-500">{t('coach.autopilotDesc')}</p>
                            </div>
                            <button onClick={() => setTraining(t => ({ ...t, isActive: !t.isActive }))} className={`w-16 h-9 rounded-full transition-all p-1 flex items-center flex-shrink-0 ${training.isActive ? 'bg-yellow-500' : 'bg-white/10'}`}>
                                <div className={`w-7 h-7 rounded-full bg-black transition-all transform ${training.isActive ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        {training.isActive && (
                            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-300 mb-2"><span>{t('coach.danceDuration')}</span><span className="text-yellow-500">{training.trackDurationLimit}s</span></div>
                                    <input type="range" min="30" max="300" step="15" value={training.trackDurationLimit} onChange={e => setTraining(t => ({ ...t, trackDurationLimit: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm text-gray-300 mb-2"><span>{t('coach.feedbackPause')}</span><span className="text-yellow-500">{training.pauseDuration}s</span></div>
                                    <input type="range" min="5" max="60" step="5" value={training.pauseDuration} onChange={e => setTraining(t => ({ ...t, pauseDuration: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-4 py-5 bg-yellow-500 text-black font-black uppercase rounded-[1.5rem] hover:bg-yellow-400 transition-all shrink-0">
                    {t('coach.close')}
                </button>
            </div>
        </div>
    );
};

export default TrainingModal;
