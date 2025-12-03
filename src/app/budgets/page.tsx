"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import { useToast } from "@/components/ui/ToastContext"

interface Budget {
  id: string
  categoryId: string
  category: {
    name: string
    icon: string | null
  }
  name: string | null
  amount: number
  period: string
  createdAt: string
  updatedAt: string
}

interface Expense {
  id: string
  amount: number
  categoryId: string
  createdAt: string
}

export default function Budgets() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    name: "",
    period: "monthly"
  })

  const fetchBudgets = useCallback(async () => {
    try {
      setBudgetsLoading(true)
      const response = await fetch("/api/budgets")
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error("Error fetching budgets:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load budgets"
      })
    } finally {
      setBudgetsLoading(false)
    }
  }, [addToast])

  const fetchExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true)
      // Fetch all expenses to calculate budget spending accurately
      const response = await fetch("/api/expenses?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setExpensesLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true)
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchBudgets()
      fetchExpenses()
      fetchCategories()
    }
  }, [session, status, router, fetchBudgets, fetchExpenses, fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingBudget ? "PUT" : "POST"
      const url = editingBudget ? `/api/budgets/${editingBudget.id}` : "/api/budgets"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Success",
          message: `Budget ${editingBudget ? 'updated' : 'created'} successfully`
        })
        fetchBudgets()
        resetForm()
        setShowForm(false)
      } else {
        const error = await response.json()
        addToast({
          type: "error",
          title: "Error",
          message: error.error || "Failed to save budget"
        })
      }
    } catch (error) {
      console.error("Error saving budget:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to save budget"
      })
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
      name: budget.name || "",
      period: budget.period
    })
    setShowForm(true)
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return
    }

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Success",
          message: "Budget deleted successfully"
        })
        fetchBudgets()
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to delete budget"
        })
      }
    } catch (error) {
      console.error("Error deleting budget:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete budget"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      categoryId: "",
      amount: "",
      name: "",
      period: "monthly"
    })
    setEditingBudget(null)
  }

  const handleNew = () => {
    resetForm()
    setShowForm(true)
  }

  const getBudgetProgress = (budget: Budget) => {
    // Special logic for "monthly budget" categories - track ALL expenses across all categories
    const isMonthlyBudgetCategory = budget.category.name.toLowerCase().includes('monthly') ||
                                    budget.category.name.toLowerCase().includes('overall') ||
                                    budget.category.name.toLowerCase().includes('total')

    // If this is a monthly budget category, use ALL expenses, otherwise filter by category
    const relevantExpenses = isMonthlyBudgetCategory
      ? expenses
      : expenses.filter((expense: Expense) => expense.categoryId === budget.categoryId)

    // Calculate date range based on budget period - use current period boundaries
    const now = new Date()
    const budgetStartDate = new Date(budget.createdAt)
    let startDate = new Date(budgetStartDate)
    let periodStartDate: Date

    // Calculate period boundaries based on budget period
    switch (budget.period) {
      case "weekly":
        // Start of week (7 days ago)
        periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        // Start of current month (always 1st of month)
        periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "yearly":
        // Start of current year (January 1st)
        periodStartDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        periodStartDate = new Date(budgetStartDate)
    }

    // For budgeting, we want to include the entire period's expenses, even if budget was created later
    // So if budget was created after the period start, we still show all period expenses
    startDate = periodStartDate

    // If budget was created before the period start, we should still show the period expenses
    // This gives users a full view of spending, even for budgets that started mid-period

    // Filter expenses within the period timeframe (always show full period)
    const periodExpenses = relevantExpenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.createdAt)
      return expenseDate >= startDate && expenseDate <= now
    })

    // Calculate total spent in this period
    const spent = periodExpenses.reduce((total: number, expense: Expense) => total + expense.amount, 0)

    return {
      spent,
      progress: Math.min((spent / budget.amount) * 100, 100)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-600"
    if (progress >= 80) return "bg-yellow-600"
    return "bg-green-600"
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const initialLoading = status === "loading" || budgetsLoading || categoriesLoading;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && <DashboardHeader user={session.user} />}

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-indigo-200 rounded w-32 animate-pulse"></div>
            </div>

            {/* Loading Status */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600">Loading your budgets...</span>
            </div>

            {/* Budget Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gray-300 rounded-full h-3 w-2/3"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-12 mt-1"></div>
                    </div>

                    {/* Action Buttons */}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Budgets</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track and manage your spending budgets by category
              </p>
            </div>
            <button
              onClick={handleNew}
              className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Budget
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingBudget ? "Edit Budget" : "Add New Budget"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Budget name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Period
                      </label>
                      <select
                        value={formData.period}
                        onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >
                      {editingBudget ? "Update Budget" : "Add Budget"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Budgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const { spent, progress } = getBudgetProgress(budget)
              const remaining = budget.amount - spent

              return (
                <div key={budget.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{budget.category.icon || "💰"}</span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {budget.name || budget.category.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {budget.period} budget: ${budget.amount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Spent: ${spent.toFixed(2)}</span>
                        <span>Remaining: ${remaining > 0 ? remaining.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {progress.toFixed(0)}% used
                      </p>
                    </div>

                    {remaining < 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          ⚠️ Budget exceeded by ${Math.abs(remaining).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {budgets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set up</h3>
              <p className="text-gray-500 mb-4">
                Create budgets for your categories to better manage your spending.
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Budget
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
