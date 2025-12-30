import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', parentId: '', status: 'active', image: null
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const [treeRes, flatRes] = await Promise.all([
                categoryAPI.getAll(),
                categoryAPI.getFlat()
            ]);
            setCategories(treeRes.data.data);
            setFlatCategories(flatRes.data.data);
        } catch (error) {
            toast.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalType('create');
        setFormData({ name: '', description: '', parentId: '', status: 'active', image: null });
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setModalType('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parentId: category.parentId || '',
            status: category.status,
            image: null
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'create') {
                await categoryAPI.create(formData);
                toast.success('Tạo danh mục thành công');
            } else {
                await categoryAPI.update(selectedCategory.id, formData);
                toast.success('Cập nhật danh mục thành công');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xóa danh mục "${name}"?`)) return;
        try {
            await categoryAPI.delete(id);
            toast.success('Xóa thành công');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa');
        }
    };

    const renderCategories = (items, level = 0) => {
        return items.map(cat => (
            <React.Fragment key={cat.id}>
                <tr>
                    <td style={{ paddingLeft: `${level * 25 + 15}px` }}>
                        {level > 0 && <span className="tree-line">└─ </span>}
                        {cat.name}
                    </td>
                    <td>{cat.productCount || 0}</td>
                    <td>
                        <span className={`badge badge-${cat.status === 'active' ? 'success' : 'secondary'}`}>
                            {cat.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                    </td>
                    <td>
                        <div className="table-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => openEditModal(cat)}>
                                <FiEdit2 />
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id, cat.name)}>
                                <FiTrash2 />
                            </button>
                        </div>
                    </td>
                </tr>
                {cat.children && renderCategories(cat.children, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="categories-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý danh mục</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FiPlus /> Thêm danh mục
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tên danh mục</th>
                                    <th>Sản phẩm</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>{renderCategories(categories)}</tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalType === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tên danh mục *</label>
                                    <input type="text" className="form-input" required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Danh mục cha</label>
                                    <select className="form-input"
                                        value={formData.parentId}
                                        onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                    >
                                        <option value="">-- Không có --</option>
                                        {flatCategories.filter(c => c.id !== selectedCategory?.id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea className="form-input" rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

export default Categories;
