"use client"

import { useState, useEffect, useCallback } from "react"

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
}

interface ExpenseListProps {
  // This component can be used for both dashboard and full expense list
  limit?: number
  category?: string
  startDate?: string
  endDate?: string
  search?: string
}

export default function ExpenseList({ limit, category, startDate, endDate, search }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)

      // Build query parameters for API filters
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (limit) params.set('limit', limit.toString())
      if (category) params.set('category', category)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/expenses?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()

        if (page === 1) {
          setAllExpenses(data.expenses)
        } else {
          setAllExpenses(prev => [...prev, ...data.expenses])
        }

        setHasMore(data.expenses.length === (limit || 20))
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, category, startDate, endDate])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Apply client-side filtering for search functionality
  useEffect(() => {
    let filtered = allExpenses

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim()
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm) ||
        expense.category.name.toLowerCase().includes(searchTerm)
      )
    }

    // Limit results if specified (for dashboard)
    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    setFilteredExpenses(filtered)
    setExpenses(filtered)
  }, [allExpenses, search, limit])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }

  if (loading && expenses.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {limit ? "Recent Expenses" : "All Expenses"}
          </h3>
          {!limit && (
            <span className="text-sm text-gray-500">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No expenses found</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm mr-3"
                      style={{ backgroundColor: expense.category.color }}
                    >
                      {expense.category.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.category.name} • {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
