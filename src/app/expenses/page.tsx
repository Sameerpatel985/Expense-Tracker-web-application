"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import ExpenseList from "@/components/dashboard/ExpenseList"

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

function ExpensesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    search: ""
  })
  const [loading, setLoading] = useState(true)

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

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)

    // Update URL params
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val) params.set(key, val)
    })
    router.push(`/expenses?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      category: "",
      startDate: "",
      endDate: "",
      search: ""
    })
    router.push("/expenses")
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
              <span className="text-sm text-gray-600">Loading your expenses...</span>
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-indigo-200 rounded w-32 animate-pulse"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white shadow rounded-lg mb-6 animate-pulse">
              <div className="px-4 py-5 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className={index === 4 ? "flex items-end" : ""}>
                      <div className={index === 4 ? "h-10 w-full bg-gray-200 rounded" : "h-12 bg-gray-200 rounded"}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expenses Table Skeleton */}
            <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
              <div className="px-4 py-5 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="w-20 h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Expenses</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and filter all your expense records
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Expense
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <ExpenseList
            category={filters.category}
            startDate={filters.startDate}
            endDate={filters.endDate}
            search={filters.search}
          />
        </div>
      </div>
    </div>
  )
}

export default function Expenses() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpensesContent />
    </Suspense>
  )
}
