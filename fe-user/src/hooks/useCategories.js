import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategories();
        setCategories(response.categories || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải danh mục');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useCategoryTree = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategoryTree();
        setTree(response.tree || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải cây danh mục');
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, []);

  return { tree, loading, error };
};
