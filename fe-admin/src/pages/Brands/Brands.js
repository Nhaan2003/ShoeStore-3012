import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { brandAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Brands.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', website: '', status: 'active', logo: null
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await brandAPI.getAll();
            setBrands(response.data.data);
        } catch (error) {
            toast.error('Không thể tải thương hiệu');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalType('create');
        setFormData({ name: '', description: '', website: '', status: 'active', logo: null });
        setShowModal(true);
    };

    const openEditModal = (brand) => {
        setModalType('edit');
        setSelectedBrand(brand);
        setFormData({
            name: brand.name,
            description: brand.description || '',
            website: brand.website || '',
            status: brand.status,
            logo: null
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'create') {
                await brandAPI.create(formData);
                toast.success('Tạo thương hiệu thành công');
            } else {
                await brandAPI.update(selectedBrand.id, formData);
                toast.success('Cập nhật thương hiệu thành công');
            }
            setShowModal(false);
            fetchBrands();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xóa thương hiệu "${name}"?`)) return;
        try {
            await brandAPI.delete(id);
            toast.success('Xóa thành công');
            fetchBrands();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa');
        }
    };

    return (
        <div className="brands-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý thương hiệu</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FiPlus /> Thêm thương hiệu
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : (
                        <div className="brands-grid">
                            {brands.map(brand => (
                                <div key={brand.id} className="brand-card">
                                    <div className="brand-logo">
                                        {brand.logo ? (
                                            <img src={`${API_URL}${brand.logo}`} alt={brand.name} />
                                        ) : (
                                            <span>{brand.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="brand-info">
                                        <h3>{brand.name}</h3>
                                        <p>{brand.productCount || 0} sản phẩm</p>
                                        <span className={`badge badge-${brand.status === 'active' ? 'success' : 'secondary'}`}>
                                            {brand.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                                        </span>
                                    </div>
                                    <div className="brand-actions">
                                        <button className="btn btn-sm btn-primary" onClick={() => openEditModal(brand)}>
                                            <FiEdit2 />
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(brand.id, brand.name)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalType === 'create' ? 'Thêm thương hiệu' : 'Sửa thương hiệu'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tên thương hiệu *</label>
                                    <input type="text" className="form-input" required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input type="url" className="form-input"
                                        value={formData.website}
                                        onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea className="form-input" rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Logo</label>
                                    <input type="file" accept="image/*"
                                        onChange={e => setFormData(prev => ({ ...prev, logo: e.target.files[0] }))}
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

export default Brands;
