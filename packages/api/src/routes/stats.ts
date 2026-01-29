import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/stats - Get overall chain statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const [
      latestBlock,
      totalBlocks,
      totalTxs,
      totalAccounts,
      recentTxCount,
      txByStatus,
    ] = await Promise.all([
      prisma.block.findFirst({ orderBy: { height: 'desc' } }),
      prisma.block.count(),
      prisma.transaction.count(),
      prisma.account.count(),
      // Transactions in last 24 hours
      prisma.transaction.count({
        where: {
          blockTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statusStats = txByStatus.reduce(
      (acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      latestBlock: latestBlock
        ? {
            height: latestBlock.height,
            hash: latestBlock.hash,
            timestamp: latestBlock.timestamp,
          }
        : null,
      totalBlocks,
      totalTransactions: totalTxs,
      totalAccounts,
      transactionsLast24h: recentTxCount,
      transactionsByStatus: statusStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/charts/blocks - Get block production chart data
router.get('/charts/blocks', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const blocks = await prisma.block.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
      select: {
        height: true,
        timestamp: true,
        txCount: true,
        gasUsed: true,
      },
    });

    // Group by day
    const dailyStats = blocks.reduce(
      (acc, block) => {
        const day = block.timestamp.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { blocks: 0, transactions: 0, gasUsed: BigInt(0) };
        }
        acc[day].blocks++;
        acc[day].transactions += block.txCount;
        acc[day].gasUsed += block.gasUsed;
        return acc;
      },
      {} as Record<string, { blocks: number; transactions: number; gasUsed: bigint }>
    );

    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      blocks: stats.blocks,
      transactions: stats.transactions,
      gasUsed: stats.gasUsed.toString(),
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching block chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/charts/transactions - Get transaction chart data
router.get('/charts/transactions', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: { blockTime: { gte: since } },
      orderBy: { blockTime: 'asc' },
      select: {
        blockTime: true,
        type: true,
        status: true,
      },
    });

    // Group by day and type
    const dailyStats = transactions.reduce(
      (acc, tx) => {
        const day = tx.blockTime.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { total: 0, success: 0, failed: 0, byModule: {} };
        }
        acc[day].total++;
        acc[day][tx.status as 'success' | 'failed']++;

        // Extract module from type
        const module = tx.type.includes('.bridge.')
          ? 'bridge'
          : tx.type.includes('.forks.')
            ? 'forks'
            : tx.type.includes('.volt.')
              ? 'volt'
              : tx.type.includes('.zkos.')
                ? 'zkos'
                : 'other';

        acc[day].byModule[module] = (acc[day].byModule[module] || 0) + 1;
        return acc;
      },
      {} as Record<
        string,
        { total: number; success: number; failed: number; byModule: Record<string, number> }
      >
    );

    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching transaction chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/modules - Get module-level statistics
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const [deposits, withdrawals, zkosTransfers, zkosMintBurns, delegateKeys, fragments, activeFragments] =
      await Promise.all([
        prisma.btcDeposit.count(),
        prisma.btcWithdrawal.count(),
        prisma.zkosTransfer.count(),
        prisma.zkosMintBurn.count(),
        prisma.delegateKey.count(),
        prisma.fragment.count(),
        // Count distinct fragment IDs from signers (fragments with activity)
        prisma.fragmentSigner.groupBy({
          by: ['fragmentId'],
        }).then(groups => groups.length),
      ]);

    // Get volume stats
    const [depositVolume, withdrawalVolume, mintBurnVolume] = await Promise.all([
      prisma.btcDeposit.aggregate({ _sum: { depositAmount: true } }),
      prisma.btcWithdrawal.aggregate({ _sum: { withdrawAmount: true } }),
      prisma.zkosMintBurn.aggregate({ _sum: { btcValue: true } }),
    ]);

    res.json({
      bridge: {
        deposits,
        withdrawals,
        depositVolume: (depositVolume._sum.depositAmount || BigInt(0)).toString(),
        withdrawalVolume: (withdrawalVolume._sum.withdrawAmount || BigInt(0)).toString(),
      },
      forks: {
        delegateKeys,
      },
      volt: {
        fragments,
        activeFragments,
      },
      zkos: {
        transfers: zkosTransfers,
        mintBurns: zkosMintBurns,
        volume: (mintBurnVolume._sum.btcValue || BigInt(0)).toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching module stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
