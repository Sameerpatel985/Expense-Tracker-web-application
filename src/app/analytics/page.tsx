/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

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

interface CategoryExpense {
  category: string
  amount: number
  color: string
  icon: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Index signature for Chart compatibility
}

interface MonthlyExpense {
  month: string
  amount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Index signature for Chart compatibility
}

export default function Analytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch("/api/expenses?limit=1000") // Get more expenses for better analytics
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchExpenses()
    }
  }, [session, status, router, fetchExpenses])

  // Memoize expensive calculations
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses])

  const currentMonthSpent = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses])

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, CategoryExpense>()

    expenses.forEach(expense => {
      const key = expense.category.name
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.amount += expense.amount
      } else {
        categoryMap.set(key, {
          category: key,
          amount: expense.amount,
          color: expense.category.color,
          icon: expense.category.icon
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount)
  }, [expenses])

  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, number>()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate >= sixMonthsAgo) {
        const monthKey = expenseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + expense.amount)
      }
    })

    return Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0] + " 01")
        const dateB = new Date(b[0] + " 01")
        return dateA.getTime() - dateB.getTime()
      })
      .map(([month, amount]) => ({ month, amount }))
  }, [expenses])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && <DashboardHeader user={session.user} />}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your spending patterns and financial insights
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Spent
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${totalSpent.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${currentMonthSpent.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Transactions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {expenses.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown - Pie Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Spending by Category
                </h3>
                <div className="h-96">
                  {categoryData.length > 0 && categoryData.some(d => d.amount > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="category"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => {
                            const formattedValue = `$${value.toFixed(2)}`;
                            const categoryName = props.payload.category;
                            return [formattedValue, categoryName];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-center py-8">No expense data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Trend - Bar Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Monthly Spending Trend
                </h3>
                <div className="h-96">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5, }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                           formatter={(value: any) => [`$${value.toFixed(2)}`, 'Total']}
                           labelFormatter={(label: string) => label}
                        />
                        <Legend />
                        <Bar dataKey="amount" fill="#3b82f6" name="Monthly Spending" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-center py-8">No data for the past 6 months</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Financial Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-sm font-medium text-gray-900">Top Spending Category</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {categoryData.length > 0 && categoryData[0].amount > 0 ? `${categoryData[0].icon} ${categoryData[0].category} - $${categoryData[0].amount.toFixed(2)}` : "No data available"}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-sm font-medium text-gray-900">Average Monthly Spending</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    ${monthlyData.length > 0 ? (totalSpent / monthlyData.length).toFixed(2) : "0.00"} per month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
