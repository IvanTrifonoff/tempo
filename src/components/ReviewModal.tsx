import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../constants';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    initialRating?: number;
    initialComment?: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, initialRating = 0, initialComment = '' }) => {
    const { t } = useTranslation();
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            onClose();
        } catch (error) {
            console.error('Failed to submit review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-[#121212] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center pt-8">

                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                className="p-1 transition-transform active:scale-90"
                                onMouseEnter={() => setHover(s)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => setRating(s)}
                            >
                                <Star
                                    size={32}
                                    className={`${(hover || rating) >= s ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
                                        } transition-colors duration-200`}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition resize-none mb-6 placeholder:text-gray-600 font-light"
                        placeholder={t('review.placeholder') || 'Tell us what you think...'}
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="w-full py-4 bg-yellow-500 text-black font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                {initialRating > 0 ? (t('review.update') || 'Update Feedback') : (t('review.submit') || 'Send Feedback')}
                                <Send size={16} strokeWidth={2.5} />
                            </>
                        )}
                    </button>

                    <p className="mt-4 text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                        v{APP_VERSION}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
