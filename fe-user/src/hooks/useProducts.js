import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts({
        ...initialParams,
        ...params,
      });
      setProducts(response.products || response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 12,
        total: response.total || 0,
        totalPages: response.totalPages || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
};

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await productService.getProductById(id);
        setProduct(response);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};

export const useFeaturedProducts = (limit = 8) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getFeaturedProducts(limit);
        setProducts(response.products || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm nổi bật');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  return { products, loading, error };
};

export const useNewProducts = (limit = 8) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getNewProducts(limit);
        setProducts(response.products || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm mới');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  return { products, loading, error };
};

export const useRelatedProducts = (productId, limit = 4) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const response = await productService.getRelatedProducts(productId, limit);
        setProducts(response.products || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm liên quan');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productId, limit]);

  return { products, loading, error };
};

export const useProductSearch = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, params = {}) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await productService.searchProducts(query, params);
      setProducts(response.products || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, search };
};
