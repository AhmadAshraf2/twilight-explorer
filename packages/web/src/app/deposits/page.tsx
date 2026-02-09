'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Wallet, Clock, ArrowDownToLine } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getDeposits } from '@/lib/api';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

export default function DepositsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['deposits', page, limit],
    queryFn: () => getDeposits(page, limit),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent-green/20 rounded-[7px] border border-card-border/50">
          <ArrowDownToLine className="w-6 h-6 text-accent-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">BTC Deposits</h1>
          <p className="text-text-secondary text-sm">
            Confirmed Bitcoin deposits to Twilight
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Deposits</h2>
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
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Twilight Address</th>
                  <th>BTC Height</th>
                  <th>Block</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="font-medium">#{deposit.id}</td>
                    <td>
                      <span className="text-accent-green font-medium">
                        {formatSatoshis(deposit.depositAmount)}
                      </span>
                    </td>
                    <td>
                      <Link href={`/accounts/${deposit.twilightDepositAddress}`} className="font-mono text-sm">
                        {deposit.twilightDepositAddress.substring(0, 20)}...
                      </Link>
                    </td>
                    <td className="text-text-secondary font-mono">
                      {parseInt(deposit.btcHeight).toLocaleString()}
                    </td>
                    <td>
                      <Link
                        href={`/blocks/${deposit.blockHeight}`}
                        className="text-text-secondary hover:text-primary-light"
                      >
                        #{deposit.blockHeight.toLocaleString()}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-text-secondary text-sm">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(deposit.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-10">No deposits found</div>
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
