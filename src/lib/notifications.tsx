import { Resend } from 'resend';

// Initialize the service at runtime
let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface BudgetNotificationData {
  userId: string;
  budgetId: string;
  budgetName: string;
  categoryName: string;
  budgetAmount: number;
  totalSpent: number;
  percentage: number;
  threshold: number;
  userEmail: string;
}

export async function sendEmailNotification({
  userEmail,
  budgetName,
  categoryName,
  totalSpent,
  percentage,
  threshold,
}: Omit<BudgetNotificationData, 'userId' | 'budgetId'> & {
  userEmail: string;
  budgetName: string;
  categoryName: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.error('Resend service not initialized');
    return { success: false, error: 'Resend service not configured' };
  }

  const content = `
    Budget Alert!

    You've reached ${percentage}% of your ${budgetName} budget.

    Category: ${categoryName}
    Amount Spent: $${totalSpent.toFixed(2)}
    Threshold Alert: ${threshold}%

    This is an automated notification to help you stay on track with your expenses.
  `;

  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@expense-tracker.com',
      to: userEmail,
      subject: `Budget Alert: ${percentage}% of ${budgetName} spent`,
      text: content,
    });

    return { success: true, messageId: data.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendBudgetNotification(
  data: BudgetNotificationData,
  type: 'email'
) {
  if (type === 'email') {
    return sendEmailNotification(data);
  }

  throw new Error('Only email notifications are supported');
}
