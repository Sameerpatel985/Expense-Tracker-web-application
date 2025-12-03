interface DashboardStats {
  totalExpenses: number
  monthlyExpenses: number
  categoryCount: number
  recentTransactions: number
}

interface QuickStatsProps {
  stats: DashboardStats
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const statCards = [
    {
      name: "This Month",
      value: `$${stats.monthlyExpenses.toFixed(2)}`,
      icon: "📅",
      color: "bg-blue-500"
    },
    {
      name: "Categories",
      value: stats.categoryCount.toString(),
      icon: "🏷️",
      color: "bg-green-500"
    },
    {
      name: "Recent",
      value: stats.recentTransactions.toString(),
      icon: "🕐",
      color: "bg-purple-500"
    },
    {
      name: "Total",
      value: "$0.00", // This would be calculated from all expenses
      icon: "💰",
      color: "bg-yellow-500"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
