import { prisma } from '../config/prisma.js';
import { success } from '../utils/helpers.js';

export async function getDashboardStats(merchantId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders,
      monthlyRevenueAgg,
      lastMonthRevenueAgg,
      totalConversations,
      aiConversations,
      totalCustomers,
      totalProducts,
      pendingOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.aggregate({
        where: { merchantId, createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { merchantId, createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.conversation.count({ where: { merchantId } }),
      prisma.message.count({
        where: {
          conversation: { merchantId },
          role: 'BOT',
        },
      }),
      prisma.customer.count({ where: { merchantId } }),
      prisma.product.count({ where: { merchantId } }),
      prisma.order.count({ where: { merchantId, status: 'PENDING' } }),
    ]);

    const monthlyRevenue = Number(monthlyRevenueAgg._sum.totalAmount || 0);
    const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.totalAmount || 0);
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : monthlyRevenue > 0 ? 100 : 0;
    const totalMessages = totalConversations > 0
      ? await prisma.message.count({ where: { conversation: { merchantId } } })
      : 0;
    const aiHandleRate = totalMessages > 0
      ? Math.round((aiConversations / totalMessages) * 100)
      : 0;

    return success({
      totalOrders,
      revenue: monthlyRevenue,
      revenueGrowth,
      aiHandleRate,
      pendingOrders,
      totalCustomers,
      totalProducts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get dashboard stats';
    return { success: false, error: message };
  }
}

export async function getRecentOrders(merchantId: string, limit = 5) {
  try {
    const orders = await prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true } } },
          take: 1,
        },
      },
    });

    const data = orders.map(o => ({
      id: o.id,
      customerName: o.customer.name,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      source: o.source,
      createdAt: o.createdAt,
      previewMessage: o.items[0]
        ? `${o.items[0].qty}x ${o.items[0].product.name}`
        : '-',
    }));

    return success(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get recent orders';
    return { success: false, error: message };
  }
}

export async function getRecentActivity(merchantId: string, limit = 10) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return success(logs);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get recent activity';
    return { success: false, error: message };
  }
}
