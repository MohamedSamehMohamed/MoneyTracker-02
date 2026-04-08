import { useState, useEffect } from 'react';
import { categoriesApi } from '../services/api';
import type { Category } from '../types/transaction';
import { CategoryForm } from '../components/CategoryForm';
import toast from 'react-hot-toast';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await categoriesApi.list();
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      setError(error?.error || 'Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, {
          name: data.name,
          icon: data.icon,
          color: data.color,
        });
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create({
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
        });
        toast.success('Category created successfully');
      }
      await fetchCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      console.error('Failed to save category:', error);
      toast.error(error?.error || 'Failed to save category');
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeletingLoading(true);
      await categoriesApi.delete(deletingCategory.id);
      await fetchCategories();
      setDeletingCategory(null);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      setDeleteError(error?.error || 'Failed to delete category. Please try again.');
      toast.error(error?.error || 'Failed to delete category');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingCategory(null);
    setDeleteError('');
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deletingCategory) {
        handleCancelDelete();
      }
    };

    if (deletingCategory) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [deletingCategory]);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Categories</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mt-6"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Categories</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Categories</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600 mb-4">No categories found.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create your first category
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Category
        </button>
      </div>

      <div className="space-y-8">
        {incomeCategories.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-4">Income</h2>
            <div className="grid gap-3">
              {incomeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} onEdit={handleEditCategory} onDelete={handleDeleteCategory} />
              ))}
            </div>
          </section>
        )}

        {expenseCategories.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-red-700 mb-4">Expense</h2>
            <div className="grid gap-3">
              {expenseCategories.map((category) => (
                <CategoryCard key={category.id} category={category} onEdit={handleEditCategory} onDelete={handleDeleteCategory} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CategoryForm
        key={editingCategory ? editingCategory.id : 'create'}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingCategory ? {
          name: editingCategory.name,
          type: editingCategory.type,
          icon: editingCategory.icon || '',
          color: editingCategory.color || '',
        } : undefined}
        mode={editingCategory ? 'edit' : 'create'}
      />

      {deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelDelete}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Delete Category</h2>
            </div>
            <div className="p-4">
              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-800 text-sm">{deleteError}</p>
                </div>
              )}
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-medium">{deletingCategory.name}</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeletingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300"
                disabled={isDeletingLoading}
              >
                {isDeletingLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: (category: Category) => void; onDelete: (category: Category) => void }) {
  const isSystemDefault = category.userId === null;

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-2xl">
        {category.icon || '📌'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
          {isSystemDefault && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              System
            </span>
          )}
        </div>
      </div>

      {category.color && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: category.color }}></div>
      )}

      {!isSystemDefault && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="flex-shrink-0 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
