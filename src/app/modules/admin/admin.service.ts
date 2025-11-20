import prisma from "../../config/db";

class AdminService {
  // 📊 Dashboard analytics overview
  async getDashboardStats(companyId: string) {
    const totalUsers = await prisma.user.count({ where: { companyId } });
    const totalTeams = await prisma.team.count({ where: { companyId } });
    const totalShifts = await prisma.shift.count({ where: { companyId } });

    const activeSubs = await prisma.subscription.count({
      where: { status: "active" },
    });

    const totalPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    return {
      totalUsers,
      totalTeams,
      totalShifts,
      activeSubscriptions: activeSubs,
      totalRevenue: totalPayments._sum.amount || 0,
    };
  }

  // 👥 Get all users under company
  async getCompanyUsers(companyId: string) {
    return prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 💼 Get all teams under company
  async getCompanyTeams(companyId: string) {
    return prisma.team.findMany({
      where: { companyId },
      include: {
        members: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 💰 Get all company payments
  async getCompanyPayments(companyId: string) {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);
    return prisma.payment.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
    });
  }

  // 🔍 Get detailed roster analytics (optional)
  async getRosterAnalytics(companyId: string) {
    const totalShifts = await prisma.shift.count({ where: { companyId } });
    const upcoming = await prisma.shift.count({
      where: { companyId, startTime: { gt: new Date() } },
    });
    const completed = await prisma.shift.count({
      where: { companyId, endTime: { lt: new Date() } },
    });

    return {
      totalShifts,
      upcomingShifts: upcoming,
      completedShifts: completed,
    };
  }
}

export default new AdminService();
