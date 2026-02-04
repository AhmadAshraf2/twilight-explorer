'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Wallet, Clock, ArrowUpFromLine } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getWithdrawals } from '@/lib/api';
import clsx from 'clsx';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  signed: 'badge-info',
  broadcast: 'badge-info',
  confirmed: 'badge-success',
};

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', page, limit],
    queryFn: () => getWithdrawals(page, limit),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent-orange/20 rounded-lg">
          <ArrowUpFromLine className="w-6 h-6 text-accent-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">BTC Withdrawals</h1>
          <p className="text-text-secondary text-sm">
            Bitcoin withdrawal requests from Twilight
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Twilight Address</th>
                  <th>BTC Address</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="font-medium">#{withdrawal.id}</td>
                    <td>
                      <span className="text-accent-orange font-medium">
                        {formatSatoshis(withdrawal.withdrawAmount)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/accounts/${withdrawal.twilightAddress}`}
                        className="font-mono text-sm text-primary-light hover:text-primary"
                      >
                        {withdrawal.twilightAddress.substring(0, 20)}...
                      </Link>
                    </td>
                    <td>
                      <a
                        href={`https://mempool.space/address/${withdrawal.withdrawAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-primary-light hover:text-primary"
                      >
                        {withdrawal.withdrawAddress.substring(0, 16)}...
                      </a>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'badge',
                          statusColors[withdrawal.status] || 'badge-info'
                        )}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-text-secondary text-sm">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(withdrawal.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
