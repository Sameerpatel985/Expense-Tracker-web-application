import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user information (excluding sensitive data like password)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all categories
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get all expenses with category information
    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Get all budgets with category information
    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get all goals
    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user,
      statistics: {
        totalCategories: categories.length,
        totalExpenses: expenses.length,
        totalExpensesValue: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        totalBudgets: budgets.length,
        totalBudgetsValue: budgets.reduce((sum, budget) => sum + budget.amount, 0),
        totalGoals: goals.length,
        totalGoalsValue: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      },
      categories,
      expenses,
      budgets,
      goals,
    }

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="expense-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
