"use client"

import { useState, useEffect, useCallback } from "react"

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface ExpenseFormProps {
  onClose: () => void
  onExpenseAdded: () => void
  expense?: {
    id: string
    description: string
    amount: number
    date: string
    categoryId: string
  }
}

export default function ExpenseForm({ onClose, onExpenseAdded, expense }: ExpenseFormProps) {

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    categoryId: expense?.categoryId || ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        if (data.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: data[0].id }))
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [formData.categoryId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0"
    if (!formData.date) newErrors.date = "Date is required"
    if (!formData.categoryId) newErrors.categoryId = "Category is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses"
      const method = expense ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onExpenseAdded()
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to save expense" })
      }
    } catch (error) {
      console.error("Error saving expense:", error)
      setErrors({ submit: "An error occurred while saving" })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-4 sm:p-5 border max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {expense ? "Edit Expense" : "Add New Expense"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter expense description"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.categoryId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
              )}
            </div>

            {errors.submit && (
              <p className="text-red-500 text-xs">{errors.submit}</p>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {loading ? "Saving..." : expense ? "Update" : "Add"} Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
