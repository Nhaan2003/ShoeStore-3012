import { useState, useEffect } from 'react';
import { brandService } from '../services/brandService';

export const useBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await brandService.getBrands();
        setBrands(response.brands || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải thương hiệu');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, loading, error };
};

export const useFeaturedBrands = (limit = 6) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await brandService.getFeaturedBrands(limit);
        setBrands(response.brands || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải thương hiệu nổi bật');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [limit]);

  return { brands, loading, error };
};
