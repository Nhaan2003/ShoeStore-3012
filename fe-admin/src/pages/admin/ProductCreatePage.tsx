import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components/common';
import { productAdminService, categoryService, brandService } from '../../services';
import { Category, Brand } from '../../types';
import toast from 'react-hot-toast';

const variantSchema = z.object({
  size: z.string().min(1, 'Size là bắt buộc'),
  color: z.string().min(1, 'Màu sắc là bắt buộc'),
  sku: z.string().min(1, 'SKU là bắt buộc'),
  stock_quantity: z.number().min(0, 'Số lượng không hợp lệ'),
  price: z.number().min(0, 'Giá không hợp lệ'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  price: z.number().min(0, 'Giá không hợp lệ'),
  sale_price: z.number().optional(),
  category_id: z.number().min(1, 'Danh mục là bắt buộc'),
  brand_id: z.number().min(1, 'Thương hiệu là bắt buộc'),
  gender: z.enum(['male', 'female', 'unisex']),
  status: z.enum(['active', 'inactive']),
  featured: z.boolean(),
  variants: z.array(variantSchema).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      featured: false,
      gender: 'unisex',
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        categoryService.getCategories(),
        brandService.getBrands(),
      ]);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast.error('Chỉ được tải tối đa 10 ảnh');
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true);
    try {
      const response = await productAdminService.createProduct(data);

      // Upload images if any
      if (selectedImages.length > 0) {
        await productAdminService.uploadImages(response.data.id, selectedImages);
      }

      toast.success('Tạo sản phẩm thành công');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Không thể tạo sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
          <p className="text-gray-500 mt-1">Điền thông tin để tạo sản phẩm</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <Input
                  label="Tên sản phẩm"
                  placeholder="Nhập tên sản phẩm"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nhập mô tả sản phẩm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Kéo thả hoặc click để tải ảnh</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="images"
                  />
                  <label htmlFor="images">
                    <Button type="button" variant="secondary" size="sm" className="cursor-pointer">
                      Chọn ảnh
                    </Button>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Variants */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Biến thể sản phẩm</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() =>
                    append({ size: '', color: '', sku: '', stock_quantity: 0, price: 0 })
                  }
                >
                  Thêm biến thể
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Chưa có biến thể nào</p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-700">Biến thể {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <Input
                          placeholder="Size"
                          error={errors.variants?.[index]?.size?.message}
                          {...register(`variants.${index}.size`)}
                        />
                        <Input
                          placeholder="Màu sắc"
                          error={errors.variants?.[index]?.color?.message}
                          {...register(`variants.${index}.color`)}
                        />
                        <Input
                          placeholder="SKU"
                          error={errors.variants?.[index]?.sku?.message}
                          {...register(`variants.${index}.sku`)}
                        />
                        <Input
                          type="number"
                          placeholder="Số lượng"
                          error={errors.variants?.[index]?.stock_quantity?.message}
                          {...register(`variants.${index}.stock_quantity`, { valueAsNumber: true })}
                        />
                        <Input
                          type="number"
                          placeholder="Giá"
                          error={errors.variants?.[index]?.price?.message}
                          {...register(`variants.${index}.price`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Giá</h3>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Giá gốc"
                  placeholder="0"
                  error={errors.price?.message}
                  {...register('price', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Giá khuyến mãi"
                  placeholder="0"
                  {...register('sale_price', { valueAsNumber: true })}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân loại</h3>
              <div className="space-y-4">
                <Select
                  label="Danh mục"
                  required
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  error={errors.category_id?.message}
                  {...register('category_id', { valueAsNumber: true })}
                />
                <Select
                  label="Thương hiệu"
                  required
                  options={brands.map((b) => ({ value: b.id, label: b.name }))}
                  error={errors.brand_id?.message}
                  {...register('brand_id', { valueAsNumber: true })}
                />
                <Select
                  label="Giới tính"
                  options={[
                    { value: 'male', label: 'Nam' },
                    { value: 'female', label: 'Nữ' },
                    { value: 'unisex', label: 'Unisex' },
                  ]}
                  {...register('gender')}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái</h3>
              <div className="space-y-4">
                <Select
                  label="Trạng thái"
                  options={[
                    { value: 'active', label: 'Đang bán' },
                    { value: 'inactive', label: 'Ngừng bán' },
                  ]}
                  {...register('status')}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                    {...register('featured')}
                  />
                  <span className="text-sm text-gray-700">Sản phẩm nổi bật</span>
                </label>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/admin/products')}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Tạo sản phẩm
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
