"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/DashboardHeader"

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
}

const PRESET_ICONS = ["💻", "🏠", "🚗", "🍕", "🎬", "📚", "✈️", "🏥", "🛍️", "💡", "🎵", "⚽", "🍔", "☕", "👕"]
const PRESET_COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#10B981", "#6366F1", "#F97316", "#84CC16", "#6B7280"]

export default function Categories() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    icon: PRESET_ICONS[0]
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchCategories()
    }
  }, [session, status, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingCategory ? "PUT" : "POST"
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCategories()
        resetForm()
        setShowForm(false)
      } else {
        alert("Failed to save category")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Failed to save category")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || PRESET_COLORS[0],
      icon: category.icon || PRESET_ICONS[0]
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? All expenses in this category will also be deleted.")) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCategories()
      } else {
        alert("Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: PRESET_COLORS[0],
      icon: PRESET_ICONS[0]
    })
    setEditingCategory(null)
  }

  const handleNew = () => {
    resetForm()
    setShowForm(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && <DashboardHeader user={session.user} />}

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Loading Status */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600">Loading your categories...</span>
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-indigo-200 rounded w-36 animate-pulse"></div>
            </div>

            {/* Add/Edit Form Skeleton */}
            {showForm && (
              <div className="bg-white shadow rounded-lg mb-6 animate-pulse">
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-indigo-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your expense categories
              </p>
            </div>
            <button
              onClick={handleNew}
              className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Category
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Category name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {PRESET_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`w-10 h-10 rounded-md border-2 flex items-center justify-center ${
                            formData.icon === icon ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? "border-gray-800 scale-110" : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >
                      {editingCategory ? "Update" : "Add"} Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{category.icon || "📝"}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: category.color || "#6B7280" }}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏷️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first category to start organizing your expenses.
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create First Category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
