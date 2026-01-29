'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRightLeft, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getTransactions } from '@/lib/api';
import clsx from 'clsx';

const moduleFilters = [
  { value: '', label: 'All Modules' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'forks', label: 'Forks' },
  { value: 'volt', label: 'Volt' },
  { value: 'zkos', label: 'zkOS' },
];

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, limit, moduleFilter, statusFilter],
    queryFn: () =>
      getTransactions(page, limit, {
        module: moduleFilter || undefined,
        status: statusFilter as 'success' | 'failed' | undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <ArrowRightLeft className="w-6 h-6 text-primary-light" />
          </div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          >
            {moduleFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
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
                  <th>Hash</th>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((tx) => (
                  <tr key={tx.hash}>
                    <td>
                      <Link
                        href={`/txs/${tx.hash}`}
                        className="font-mono text-sm text-primary-light hover:text-primary"
                      >
                        {tx.hash.substring(0, 16)}...
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/blocks/${tx.blockHeight}`}
                        className="text-text-secondary hover:text-primary-light"
                      >
                        #{tx.blockHeight.toLocaleString()}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {tx.type.split('.').pop()?.replace('Msg', '')}
                      </span>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'badge flex items-center gap-1',
                          tx.status === 'success' ? 'badge-success' : 'badge-error'
                        )}
                      >
                        {tx.status === 'success' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-text-secondary text-sm">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(tx.blockTime), {
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
