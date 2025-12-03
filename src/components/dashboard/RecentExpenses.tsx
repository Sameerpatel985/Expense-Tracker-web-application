"use client"

import { useState } from "react"
import Link from "next/link"

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

interface RecentExpensesProps {
  expenses: Expense[]
  onExpenseDeleted: () => void
}

export default function RecentExpenses({ expenses, onExpenseDeleted }: RecentExpensesProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return
    }

    setDeletingId(expenseId)
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onExpenseDeleted()
      } else {
        alert("Failed to delete expense")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Failed to delete expense")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
          <Link
            href="/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View all →
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No expenses yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === expense.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
