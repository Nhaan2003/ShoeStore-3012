const { getPool, sql } = require('../config/database');

// @desc    Lấy tất cả thương hiệu
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;
        const pool = getPool();

        let query = `
            SELECT 
                b.brand_id,
                b.brand_name,
                b.description,
                b.logo,
                b.website,
                b.status,
                b.created_at,
                (SELECT COUNT(*) FROM Products WHERE brand_id = b.brand_id AND status = 'active') as product_count
            FROM Brands b
        `;

        if (!includeInactive || includeInactive === 'false') {
            query += " WHERE b.status = 'active'";
        }

        query += ' ORDER BY b.brand_name';

        const result = await pool.request().query(query);

        res.json({
            success: true,
            data: result.recordset.map(b => ({
                id: b.brand_id,
                name: b.brand_name,
                description: b.description,
                logo: b.logo,
                website: b.website,
                status: b.status,
                productCount: b.product_count,
                createdAt: b.created_at
            }))
        });

    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách thương hiệu'
        });
    }
};

// @desc    Lấy chi tiết thương hiệu
// @route   GET /api/brands/:id
// @access  Public
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('brandId', sql.Int, id)
            .query(`
                SELECT 
                    b.*,
                    (SELECT COUNT(*) FROM Products WHERE brand_id = b.brand_id AND status = 'active') as product_count
                FROM Brands b
                WHERE b.brand_id = @brandId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thương hiệu'
            });
        }

        const brand = result.recordset[0];

        res.json({
            success: true,
            data: {
                id: brand.brand_id,
                name: brand.brand_name,
                description: brand.description,
                logo: brand.logo,
                website: brand.website,
                status: brand.status,
                productCount: brand.product_count,
                createdAt: brand.created_at
            }
        });

    } catch (error) {
        console.error('Get brand by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Tạo thương hiệu mới (Admin)
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
    try {
        const { brandName, description, website } = req.body;
        const pool = getPool();

        // Kiểm tra tên thương hiệu đã tồn tại chưa
        const existing = await pool.request()
            .input('brandName', sql.NVarChar, brandName)
            .query('SELECT brand_id FROM Brands WHERE brand_name = @brandName');

        if (existing.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên thương hiệu đã tồn tại'
            });
        }

        let logo = null;
        if (req.file) {
            logo = `/uploads/brands/${req.file.filename}`;
        }

        const result = await pool.request()
            .input('brandName', sql.NVarChar, brandName)
            .input('description', sql.NVarChar, description)
            .input('logo', sql.NVarChar, logo)
            .input('website', sql.NVarChar, website)
            .query(`
                INSERT INTO Brands (brand_name, description, logo, website)
                OUTPUT INSERTED.brand_id
                VALUES (@brandName, @description, @logo, @website)
            `);

        res.status(201).json({
            success: true,
            message: 'Tạo thương hiệu thành công',
            data: {
                brandId: result.recordset[0].brand_id
            }
        });

    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo thương hiệu'
        });
    }
};

// @desc    Cập nhật thương hiệu (Admin)
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brandName, description, website, status } = req.body;
        const pool = getPool();

        // Kiểm tra thương hiệu tồn tại
        const existing = await pool.request()
            .input('brandId', sql.Int, id)
            .query('SELECT brand_id, logo FROM Brands WHERE brand_id = @brandId');

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thương hiệu'
            });
        }

        // Kiểm tra tên trùng với thương hiệu khác
        const duplicateName = await pool.request()
            .input('brandName', sql.NVarChar, brandName)
            .input('brandId', sql.Int, id)
            .query('SELECT brand_id FROM Brands WHERE brand_name = @brandName AND brand_id != @brandId');

        if (duplicateName.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên thương hiệu đã tồn tại'
            });
        }

        let logo = existing.recordset[0].logo;
        if (req.file) {
            logo = `/uploads/brands/${req.file.filename}`;
        }

        await pool.request()
            .input('brandId', sql.Int, id)
            .input('brandName', sql.NVarChar, brandName)
            .input('description', sql.NVarChar, description)
            .input('logo', sql.NVarChar, logo)
            .input('website', sql.NVarChar, website)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Brands
                SET brand_name = @brandName,
                    description = @description,
                    logo = @logo,
                    website = @website,
                    status = @status
                WHERE brand_id = @brandId
            `);

        res.json({
            success: true,
            message: 'Cập nhật thương hiệu thành công'
        });

    } catch (error) {
        console.error('Update brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thương hiệu'
        });
    }
};

// @desc    Xóa thương hiệu (Admin)
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Kiểm tra có sản phẩm nào thuộc thương hiệu này không
        const productCheck = await pool.request()
            .input('brandId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Products WHERE brand_id = @brandId');

        if (productCheck.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa thương hiệu đang có sản phẩm'
            });
        }

        await pool.request()
            .input('brandId', sql.Int, id)
            .query('DELETE FROM Brands WHERE brand_id = @brandId');

        res.json({
            success: true,
            message: 'Xóa thương hiệu thành công'
        });

    } catch (error) {
        console.error('Delete brand error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa thương hiệu'
        });
    }
};

module.exports = {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand
};
