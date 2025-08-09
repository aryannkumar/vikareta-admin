'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Simple component replacements
const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const Textarea = ({ id, value, onChange, placeholder }: { 
  id?: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
}) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={3}
  />
);

const Switch = ({ id, checked, onCheckedChange }: { 
  id?: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
}) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
  />
);
import { Trash2, Edit, Plus } from 'lucide-react';
// import { toast } from 'sonner';

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    featured?: boolean;
    productCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true,
        featured: false
    });

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                // Handle both paginated and non-paginated responses
                const categoriesData = result.data.data || result.data || [];
                setCategories(categoriesData);
            } else {
                toast.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async () => {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Category created successfully');
                setIsCreateDialogOpen(false);
                setFormData({ name: '', description: '', isActive: true, featured: false });
                fetchCategories();
            } else {
                toast.error('Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Error creating category');
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;

        try {
            const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Category updated successfully');
                setEditingCategory(null);
                setFormData({ name: '', description: '', isActive: true, featured: false });
                fetchCategories();
            } else {
                toast.error('Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Error updating category');
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                toast.success('Category deleted successfully');
                fetchCategories();
            } else {
                const result = await response.json();
                toast.error(result.error?.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Error deleting category');
        }
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            isActive: category.isActive,
            featured: category.featured || false
        });
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">
                        Manage product categories and classifications.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Category name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Category description"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="featured"
                                    checked={formData.featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                />
                                <Label htmlFor="featured">Featured</Label>
                            </div>
                            <Button onClick={handleCreateCategory} className="w-full">
                                Create Category
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <div className="w-6 h-6 bg-blue-600 rounded"></div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <div className="w-6 h-6 bg-green-600 rounded"></div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {categories.filter(c => c.isActive).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <div className="w-6 h-6 bg-orange-600 rounded"></div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Featured Categories</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {categories.filter(c => c.featured).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <div className="w-6 h-6 bg-purple-600 rounded"></div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {categories.reduce((sum, c) => sum + c.productCount, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Categories ({filteredCategories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="font-medium text-lg">{category.name}</div>
                                        {category.featured && (
                                            <Badge className="bg-orange-100 text-orange-700">Featured</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">Slug: {category.slug}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {category.description || 'No description provided'}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="text-xs text-gray-500">
                                            Created: {new Date(category.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Updated: {new Date(category.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary" className="text-sm">
                                        {category.productCount} products
                                    </Badge>
                                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                        {category.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(category)}
                                        className="ml-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        disabled={category.productCount > 0}
                                        className={category.productCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredCategories.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No categories found matching your search.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Category description"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="edit-isActive">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-featured"
                                checked={formData.featured}
                                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                            />
                            <Label htmlFor="edit-featured">Featured</Label>
                        </div>
                        <Button onClick={handleUpdateCategory} className="w-full">
                            Update Category
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}