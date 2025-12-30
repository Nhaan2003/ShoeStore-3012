import React, { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { reviewAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Reviews.css';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({ status: '', rating: '' });
    const [replyModal, setReplyModal] = useState({ show: false, review: null, content: '' });

    useEffect(() => {
        fetchReviews();
    }, [pagination.page, filters]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            };
            const response = await reviewAPI.getAll(params);
            setReviews(response.data.data.reviews);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination.total,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            toast.error('Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reviewId, status) => {
        try {
            await reviewAPI.updateStatus(reviewId, { status });
            toast.success('Cập nhật trạng thái thành công');
            fetchReviews();
        } catch (error) {
            toast.error('Không thể cập nhật');
        }
    };

    const handleReply = async () => {
        if (!replyModal.content.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi');
            return;
        }
        try {
            await reviewAPI.reply(replyModal.review.id, { reply: replyModal.content });
            toast.success('Phản hồi thành công');
            setReplyModal({ show: false, review: null, content: '' });
            fetchReviews();
        } catch (error) {
            toast.error('Không thể gửi phản hồi');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FiStar key={i} className={i < rating ? 'star filled' : 'star'} />
        ));
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { label: 'Chờ duyệt', class: 'warning' },
            approved: { label: 'Đã duyệt', class: 'success' },
            rejected: { label: 'Từ chối', class: 'danger' }
        };
        const info = map[status] || { label: status, class: 'secondary' };
        return <span className={`badge badge-${info.class}`}>{info.label}</span>;
    };

    return (
        <div className="reviews-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý đánh giá</h1>
            </div>

            <div className="card filters-card">
                <div className="filters-header">
                    <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                    </select>
                    <select value={filters.rating} onChange={e => setFilters(prev => ({ ...prev, rating: e.target.value }))}>
                        <option value="">Tất cả đánh giá</option>
                        <option value="5">5 sao</option>
                        <option value="4">4 sao</option>
                        <option value="3">3 sao</option>
                        <option value="2">2 sao</option>
                        <option value="1">1 sao</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : reviews.length === 0 ? (
                        <div className="empty-state"><p>Không có đánh giá nào</p></div>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <div key={review.id} className="review-item">
                                    <div className="review-header">
                                        <div>
                                            <strong>{review.userName}</strong>
                                            <span className="review-date">
                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        {getStatusBadge(review.status)}
                                    </div>
                                    <div className="review-product">
                                        Sản phẩm: <strong>{review.productName}</strong>
                                    </div>
                                    <div className="review-rating">
                                        {renderStars(review.rating)}
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    
                                    {review.adminReply && (
                                        <div className="admin-reply">
                                            <strong>Phản hồi của shop:</strong>
                                            <p>{review.adminReply}</p>
                                        </div>
                                    )}

                                    <div className="review-actions">
                                        {review.status === 'pending' && (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                >
                                                    <FiCheck /> Duyệt
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                                >
                                                    <FiX /> Từ chối
                                                </button>
                                            </>
                                        )}
                                        {!review.adminReply && (
                                            <button 
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => setReplyModal({ show: true, review, content: '' })}
                                            >
                                                <FiMessageSquare /> Phản hồi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            {[...Array(pagination.totalPages)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    className={pagination.page === idx + 1 ? 'active' : ''}
                                    onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {replyModal.show && (
                <div className="modal-overlay" onClick={() => setReplyModal({ show: false, review: null, content: '' })}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Phản hồi đánh giá</h3>
                            <button className="modal-close" onClick={() => setReplyModal({ show: false, review: null, content: '' })}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="original-review">
                                <div className="review-rating">{renderStars(replyModal.review?.rating)}</div>
                                <p>{replyModal.review?.comment}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nội dung phản hồi</label>
                                <textarea 
                                    className="form-input" 
                                    rows={4}
                                    value={replyModal.content}
                                    onChange={e => setReplyModal(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Nhập nội dung phản hồi..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setReplyModal({ show: false, review: null, content: '' })}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleReply}>Gửi phản hồi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
