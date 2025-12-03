"use client"

import { useState } from "react"
import ExpenseForm from "./ExpenseForm"

interface AddExpenseButtonProps {
  onExpenseAdded: () => void
}

export default function AddExpenseButton({ onExpenseAdded }: AddExpenseButtonProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-200"
          >
            + Add Expense
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Track your spending
          </p>
        </div>
      </div>

      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onExpenseAdded={() => {
            setShowForm(false)
            onExpenseAdded()
          }}
        />
      )}
    </>
  )
}
