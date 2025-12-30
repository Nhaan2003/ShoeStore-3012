import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';
import { promotionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Promotions.css';

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', discountType: 'percentage',
        discountValue: '', minOrderAmount: '', maxDiscountAmount: '',
        usageLimit: '', startDate: '', endDate: '', status: 'active'
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await promotionAPI.getAll();
            setPromotions(response.data.data);
        } catch (error) {
            toast.error('Không thể tải khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalType('create');
        setFormData({
            code: '', name: '', description: '', discountType: 'percentage',
            discountValue: '', minOrderAmount: '', maxDiscountAmount: '',
            usageLimit: '', startDate: '', endDate: '', status: 'active'
        });
        setShowModal(true);
    };

    const openEditModal = (promo) => {
        setModalType('edit');
        setSelectedPromo(promo);
        setFormData({
            code: promo.code,
            name: promo.name,
            description: promo.description || '',
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minOrderAmount: promo.minOrderAmount || '',
            maxDiscountAmount: promo.maxDiscountAmount || '',
            usageLimit: promo.usageLimit || '',
            startDate: promo.startDate?.split('T')[0] || '',
            endDate: promo.endDate?.split('T')[0] || '',
            status: promo.status
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                discountValue: Number(formData.discountValue),
                minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
            };
            
            if (modalType === 'create') {
                await promotionAPI.create(data);
                toast.success('Tạo khuyến mãi thành công');
            } else {
                await promotionAPI.update(selectedPromo.id, data);
                toast.success('Cập nhật khuyến mãi thành công');
            }
            setShowModal(false);
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xóa khuyến mãi "${name}"?`)) return;
        try {
            await promotionAPI.delete(id);
            toast.success('Xóa thành công');
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa');
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Đã sao chép mã');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    const getDiscountDisplay = (promo) => {
        if (promo.discountType === 'percentage') {
            return `Giảm ${promo.discountValue}%`;
        } else if (promo.discountType === 'fixed_amount') {
            return `Giảm ${formatPrice(promo.discountValue)}đ`;
        }
        return 'Miễn phí vận chuyển';
    };

    const getStatusBadge = (promo) => {
        const now = new Date();
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        
        if (promo.status !== 'active') {
            return <span className="badge badge-secondary">Tạm ẩn</span>;
        }
        if (now < start) {
            return <span className="badge badge-info">Sắp diễn ra</span>;
        }
        if (now > end) {
            return <span className="badge badge-danger">Đã hết hạn</span>;
        }
        return <span className="badge badge-success">Đang hoạt động</span>;
    };

    return (
        <div className="promotions-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý khuyến mãi</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FiPlus /> Thêm khuyến mãi
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Mã</th>
                                        <th>Tên</th>
                                        <th>Giảm giá</th>
                                        <th>Đơn tối thiểu</th>
                                        <th>Đã dùng</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map(promo => (
                                        <tr key={promo.id}>
                                            <td>
                                                <div className="promo-code">
                                                    <strong>{promo.code}</strong>
                                                    <button className="copy-btn" onClick={() => copyCode(promo.code)}>
                                                        <FiCopy />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>{promo.name}</td>
                                            <td>{getDiscountDisplay(promo)}</td>
                                            <td>{promo.minOrderAmount ? formatPrice(promo.minOrderAmount) + 'đ' : '-'}</td>
                                            <td>{promo.usedCount}/{promo.usageLimit || '∞'}</td>
                                            <td>
                                                <small>
                                                    {new Date(promo.startDate).toLocaleDateString('vi-VN')} - {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                                                </small>
                                            </td>
                                            <td>{getStatusBadge(promo)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn-sm btn-primary" onClick={() => openEditModal(promo)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(promo.id, promo.name)}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalType === 'create' ? 'Thêm khuyến mãi' : 'Sửa khuyến mãi'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Mã khuyến mãi *</label>
                                        <input type="text" className="form-input" required
                                            value={formData.code}
                                            onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            disabled={modalType === 'edit'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tên khuyến mãi *</label>
                                        <input type="text" className="form-input" required
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Loại giảm giá *</label>
                                        <select className="form-input" required
                                            value={formData.discountType}
                                            onChange={e => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                        >
                                            <option value="percentage">Phần trăm (%)</option>
                                            <option value="fixed_amount">Số tiền cố định</option>
                                            <option value="free_shipping">Miễn phí vận chuyển</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Giá trị giảm *</label>
                                        <input type="number" className="form-input" required
                                            value={formData.discountValue}
                                            onChange={e => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Đơn tối thiểu</label>
                                        <input type="number" className="form-input"
                                            value={formData.minOrderAmount}
                                            onChange={e => setFormData(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Giảm tối đa</label>
                                        <input type="number" className="form-input"
                                            value={formData.maxDiscountAmount}
                                            onChange={e => setFormData(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Ngày bắt đầu *</label>
                                        <input type="date" className="form-input" required
                                            value={formData.startDate}
                                            onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ngày kết thúc *</label>
                                        <input type="date" className="form-input" required
                                            value={formData.endDate}
                                            onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Giới hạn sử dụng</label>
                                        <input type="number" className="form-input"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                                            placeholder="Để trống = không giới hạn"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Trạng thái</label>
                                        <select className="form-input"
                                            value={formData.status}
                                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="inactive">Tạm ẩn</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea className="form-input" rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">
                                    {modalType === 'create' ? 'Tạo' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;
