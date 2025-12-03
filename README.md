# Expense Tracker - A Modern Financial Dashboard

![Expense Tracker Screenshot](https://i.imgur.com/your-screenshot-url.png) <!-- It's highly recommended to add a screenshot of your app here! -->

A full-stack, modern expense tracker built with Next.js, TypeScript, and the T3 Stack. This application provides a comprehensive suite of tools for users to manage their finances, from tracking daily expenses to gaining intelligent insights through an advanced analytics dashboard.

## ✨ Key Features

-   **Authentication**: Secure user sign-up and sign-in using NextAuth.js.
-   **Full CRUD for Expenses**: Easily create, read, update, and delete expenses.
-   **Expense Categorization**: Assign expenses to customizable categories with unique icons and colors.
-   **Advanced Analytics Dashboard**:
    -   **Spending by Category**: An interactive pie chart to visualize where your money is going.
    -   **Monthly Spending Trend**: A bar chart that tracks spending patterns over the last 6 months.
    -   **Key Metrics**: At-a-glance cards for total spending, current month's spending, and total transactions.
-   **Intelligent Financial Insights**:
    -   Identifies your top spending category.
    -   Calculates your average monthly spending.
-   **Light & Dark Mode**: A beautiful and persistent theme switcher for user comfort.
-   **Responsive Design**: A seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Database**: PostgreSQL (or any Prisma-compatible DB)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **Data Visualization**: [Recharts](https://recharts.org/)
-   **Theme Management**: [next-themes](https://github.com/pacocoursey/next-themes)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm, pnpm, or yarn
-   A PostgreSQL database (or you can switch to SQLite in `schema.prisma`)

### 1. Clone the Repository

```bash
git clone https://github.com/Deep-Bhanushali/Expense-Tracker.git
cd Expense-Tracker
2. Install Dependencies
code
Bash
npm install
# or
pnpm install
# or
yarn install

```
3. Set Up Environment Variables
Create a .env file in the root of the project by copying the example file:
code
Bash
cp .env.example .env
Now, fill in the .env file with your database URL and NextAuth.js credentials:
```
Env
# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET" # Generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Add your authentication providers here (e.g., GitHub, Google)
# GITHUB_ID=
# GITHUB_SECRET=
```
4. Push the Database Schema
Run the Prisma command to sync your schema with your database:

```Bash
npx prisma db push
```
(Optional) If you want to seed the database with initial categories, you can use Prisma's seed feature.
code
```Bash
npx prisma db seed
```
5. Run the Development Server
Start the application:
code
```Bash
npm run dev
Open http://localhost:3000 with your browser to see the result.
```
## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Fork the Project
Create your Feature Branch (git checkout -b feature/AmazingFeature)
Commit your Changes (git commit -m 'Add some AmazingFeature')
Push to the Branch (git push origin feature/AmazingFeature)
Open a Pull Request

## 📜 License
Distributed under the MIT License. See LICENSE.txt for more information.

📬 Contact

Deep Bhanushali - @your_twitter_handle - your-email@example.com

Project Link: https://github.com/Deep-Bhanushali/Expense-Tracker
