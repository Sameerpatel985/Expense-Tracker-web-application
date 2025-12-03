import { NextRequest, NextResponse } from "next/server"
import { checkAllBudgets } from "@/lib/budget-monitor"

// This endpoint is called by Vercel Cron Jobs
// It checks all budgets and sends notifications for exceeded thresholds
export async function GET(req: NextRequest) {
  try {
    // Vercel Cron Jobs include a special header 'vercel-cron' for verification
    const vercelCronHeader = req.headers.get('vercel-cron');

    // For development/testing, allow without the header
    // In production, you should verify this header
    const isVercelCron = process.env.NODE_ENV === 'production'
      ? vercelCronHeader === 'true'
      : true;

    if (!isVercelCron) {
      return NextResponse.json(
        { error: "Unauthorized - Not a valid Vercel Cron request" },
        { status: 401 }
      );
    }

    console.log('Starting budget check for all users...');

    const result = await checkAllBudgets();

    console.log(`Budget check completed: ${result.checked} budgets checked, ${result.notificationsSent} notifications sent`);

    return NextResponse.json({
      success: true,
      checked: result.checked,
      notificationsSent: result.notificationsSent,
      notifications: result.notifications,
    });
  } catch (error) {
    console.error("Error checking budgets:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For manual triggering (POST request) - useful for testing
export async function POST(req: NextRequest) {
  try {
    // In production, you might want to add authentication for manual triggering
    // For now, allowing it for testing purposes

    console.log('Manual budget check triggered...');

    const result = await checkAllBudgets();

    console.log(`Manual budget check completed: ${result.checked} budgets checked, ${result.notificationsSent} notifications sent`);

    return NextResponse.json({
      success: true,
      checked: result.checked,
      notificationsSent: result.notificationsSent,
      notifications: result.notifications,
    });
  } catch (error) {
    console.error("Error checking budgets:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
