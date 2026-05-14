import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Clock, User, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Review {
    id: number;
    user_id: string;
    rating: number;
    comment: string;
    version: string;
    created_at: string;
    email: string;
    role: string;
}

const ReviewsList: React.FC = () => {
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/reviews/admin', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold tracking-tight">{t('admin.reviews')}</h1>
                <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <span className="text-yellow-500 font-bold">{reviews.length} {t('admin.totalReviews')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-yellow-500 transition">{review.email}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-black tracking-widest mt-0.5">
                                        <span className={review.role === 'admin' ? 'text-rose-500' : review.role === 'coach' ? 'text-indigo-400' : 'text-gray-500'}>
                                            {review.role}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><HardDrive size={12} /> v{review.version}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        size={16}
                                        className={s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}
                                    />
                                ))}
                            </div>
                        </div>

                        {review.comment && (
                            <div className="bg-white/5 rounded-xl p-4 flex gap-3">
                                <MessageSquare size={18} className="text-gray-600 flex-shrink-0 mt-1" />
                                <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Clock size={14} />
                            {new Date(review.created_at).toLocaleString()}
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="text-center py-20 bg-[#111] border border-dashed border-white/10 rounded-3xl">
                        <MessageSquare size={48} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 italic">{t('admin.noReviews')}</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsList;
