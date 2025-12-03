"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import DashboardHeader from "../../components/dashboard/DashboardHeader"

import AddExpenseButton from "../../components/dashboard/AddExpenseButton"
import QuickStats from "../../components/dashboard/QuickStats"
import RecentExpenses from "../../components/dashboard/RecentExpenses"

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

interface DashboardStats {
  totalExpenses: number
  monthlyExpenses: number
  categoryCount: number
  recentTransactions: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch expenses with React Query caching
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses'],
    queryFn: async () => {
      const response = await fetch("/api/expenses?page=1&limit=5")
      if (!response.ok) throw new Error('Failed to fetch expenses')
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch categories with React Query caching
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
    enabled: !!session,
  })

  // Calculate stats from the fetched data
  const expenses = expensesData?.expenses || []
  const categories = categoriesData || []

  // Calculate dashboard stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTotal = expenses
    .filter((expense: Expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth &&
             expenseDate.getFullYear() === currentYear
    })
    .reduce((sum: number, expense: Expense) => sum + expense.amount, 0)

  const stats: DashboardStats = {
    totalExpenses: 0, // Would need more data for this
    monthlyExpenses: monthlyTotal,
    categoryCount: categories.length,
    recentTransactions: expenses.length
  }

  const isLoading = expensesLoading || categoriesLoading || status === "loading"

  const handleExpenseAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-categories'] })
  }

  const handleExpenseDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && <DashboardHeader user={session.user} />}

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Loading Status */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600">Loading your dashboard...</span>
            </div>

            {/* Welcome Section Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mt-6 lg:mt-8">
              {/* Recent Expenses Skeleton */}
              <div className="xl:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div>
                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="xl:col-span-1">
                <div className="bg-white shadow rounded-lg animate-pulse">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {session.user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Here&apos;s an overview of your expenses and financial activity.
            </p>
          </div>

          {/* Quick Stats */}
          <QuickStats stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mt-6 lg:mt-8">
            {/* Recent Expenses - Takes up 2 columns on large screens */}
            <div className="xl:col-span-2">
              <RecentExpenses
                expenses={expenses}
                onExpenseDeleted={handleExpenseDeleted}
              />
            </div>

            {/* Quick Actions - Takes up 1 column on large screens */}
            <div className="xl:col-span-1">
              <AddExpenseButton onExpenseAdded={handleExpenseAdded} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
