import { prisma } from "./prisma"

const defaultCategories = [
  { name: "food", description: "Groceries and dining out", color: "#F59E0B", icon: "🍕" },
  { name: "transportation", description: "Gas, public transport, rideshare", color: "#3B82F6", icon: "🚗" },
  { name: "entertainment", description: "Movies, games, subscriptions", color: "#8B5CF6", icon: "🎬" },
  { name: "shopping", description: "Clothing, electronics, general shopping", color: "#EC4899", icon: "🛍️" },
  { name: "bills", description: "Utilities, rent, phone, internet", color: "#EF4444", icon: "📄" },
  { name: "healthcare", description: "Medical, dental, pharmacy", color: "#10B981", icon: "🏥" },
  { name: "education", description: "Books, courses, training", color: "#6366F1", icon: "📚" },
  { name: "travel", description: "Vacations, hotels, flights", color: "#F97316", icon: "✈️" },
  { name: "home", description: "Home improvement, furniture", color: "#84CC16", icon: "🏠" },
  { name: "other", description: "Miscellaneous expenses", color: "#6B7280", icon: "💰" },
]

export async function createDefaultCategoriesForUser(userId: string) {
  try {
    const categoriesToCreate = defaultCategories.map(category => ({
      ...category,
      userId,
    }))

    await prisma.category.createMany({
      data: categoriesToCreate,
      skipDuplicates: true,
    })

    console.log(`Created default categories for user ${userId}`)
  } catch (error) {
    console.error("Error creating default categories:", error)
    throw error
  }
}
