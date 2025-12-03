import { sendBudgetNotification, BudgetNotificationData } from './notifications';
import { prisma } from './prisma';

interface BudgetProgressResult {
  budget: {
    id: string;
    name: string;
    amount: number;
    category: {
      name: string;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  totalSpent: number;
  percentage: number;
  thresholds: {
    id: string;
    threshold: number;
    type: string;
    enabled: boolean;
  }[];
}

export async function checkAllBudgets() {
  try {
    // Get current month/year for monthly budgets
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-based
    const currentYear = now.getFullYear();

    // For simplicity, let's check all budgets and their thresholds
    // In a real scenario, you'd filter by period and date

    const budgets = await prisma.budget.findMany({
      include: {
        thresholds: {
          where: {
            enabled: true,
          },
        },
        category: true,
        user: true,
      },
    });

    const results: BudgetProgressResult[] = [];

    for (const budget of budgets) {
      // Calculate total expenses for this budget's category in the current month
      const totalSpent = await prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          userId: budget.userId,
          categoryId: budget.categoryId,
          date: {
            gte: new Date(currentYear, currentMonth - 1, 1), // First day of current month
            lt: new Date(currentYear, currentMonth, 1), // First day of next month
          },
        },
      });

      const spent = totalSpent._sum.amount || 0;
      const percentage = Math.round((spent / budget.amount) * 100);

      results.push({
        budget: {
          id: budget.id,
          name: budget.name || `Budget for ${budget.category.name}`,
          amount: budget.amount,
          category: {
            name: budget.category.name,
          },
          user: {
            id: budget.userId,
            name: budget.user.name,
            email: budget.user.email,
          },
        },
        totalSpent: spent,
        percentage,
        thresholds: budget.thresholds,
      });
    }

    // Process notifications for thresholds that are exceeded
    const notifications = [];

    for (const result of results) {
      if (result.totalSpent === 0) continue; // Skip if no spending

      for (const threshold of result.thresholds) {
        if (result.percentage >= threshold.threshold) {
          // Check if we've already sent this notification today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const existingNotification = await prisma.notification.findFirst({
            where: {
              notificationThresholdId: threshold.id,
              sentAt: {
                gte: today,
              },
              status: 'sent',
            },
          });

          if (!existingNotification) {
            // Send notification
            const notificationData: BudgetNotificationData = {
              userId: result.budget.user.id,
              budgetId: result.budget.id,
              budgetName: result.budget.name,
              categoryName: result.budget.category.name,
              budgetAmount: result.budget.amount,
              totalSpent: result.totalSpent,
              percentage: result.percentage,
              threshold: threshold.threshold,
              userEmail: result.budget.user.email,
            };

            const sendResult = await sendBudgetNotification(
              notificationData,
              'email' // Only email is supported
            );

            // Record the notification
            await prisma.notification.create({
              data: {
                notificationThresholdId: threshold.id,
                sentAt: new Date(),
                type: threshold.type,
                status: sendResult.success ? 'sent' : 'failed',
                messageId: sendResult.success ? sendResult.messageId : null,
                content: JSON.stringify(notificationData),
              },
            });

            notifications.push({
              result,
              threshold,
              success: sendResult.success,
            });
          }
        }
      }
    }

    return {
      checked: results.length,
      notificationsSent: notifications.length,
      notifications,
    };
  } catch (error) {
    console.error('Error checking budgets:', error);
    throw error;
  }
}

export async function getBudgetProgress(userId: string, budgetId: string) {
  // Similar logic but for a specific budget
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      thresholds: {
        where: { userId },
      },
      category: true,
      user: true,
    },
  });

  if (!budget || budget.userId !== userId) {
    throw new Error('Budget not found or access denied');
  }

  const totalSpent = await prisma.expense.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userId,
      categoryId: budget.categoryId,
      date: {
        gte: new Date(currentYear, currentMonth - 1, 1),
        lt: new Date(currentYear, currentMonth, 1),
      },
    },
  });

  const spent = totalSpent._sum.amount || 0;
  const percentage = Math.round((spent / budget.amount) * 100);

  return {
    budget: {
      id: budget.id,
      name: budget.name || `Budget for ${budget.category.name}`,
      amount: budget.amount,
      category: budget.category.name,
    },
    totalSpent: spent,
    percentage,
    thresholds: budget.thresholds.map(t => ({
      id: t.id,
      threshold: t.threshold,
      type: t.type,
      enabled: t.enabled,
    })),
  };
}
