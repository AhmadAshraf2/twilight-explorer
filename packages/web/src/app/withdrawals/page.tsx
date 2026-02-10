'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowUpFromLine, CheckCircle, XCircle } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getWithdrawals } from '@/lib/api';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

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
        <div className="p-2 bg-accent-orange/20 rounded-[7px] border border-card-border/50">
          <ArrowUpFromLine className="w-6 h-6 text-accent-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">BTC Withdrawals</h1>
          <p className="text-text-secondary text-sm">
            Bitcoin withdrawal requests from Twilight
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Withdrawals</h2>
            <p className="text-text-secondary text-sm">
              {isLoading
                ? 'Loading…'
                : data
                  ? `Showing ${data.data.length} of ${data.pagination.total.toLocaleString()}`
                  : '—'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingTable rows={10} />
        ) : data?.data?.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Twilight Address</th>
                  <th>BTC Address</th>
                  <th>Confirmed</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((withdrawal) => (
                  <tr key={withdrawal.id}>
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
                        {withdrawal.withdrawAddress.substring(0, 20)}...
                      </a>
                    </td>
                    <td>
                      {withdrawal.isConfirmed ? (
                        <span className="badge badge-success flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="badge badge-warning flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-accent-orange font-medium">
                        {formatSatoshis(withdrawal.withdrawAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-10">No withdrawals found</div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
