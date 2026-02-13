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

const programTypeFilters = [
  { value: '', label: 'All ZKOS Types' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Message', label: 'Message' },
  { value: 'Mint', label: 'Mint' },
  { value: 'Burn', label: 'Burn' },
  { value: 'RelayerInitializer', label: 'Relayer Initializer' },
  { value: 'CreateTraderOrder', label: 'Create Trader Order' },
  { value: 'SettleTraderOrder', label: 'Settle Trader Order' },
  { value: 'CreateLendOrder', label: 'Create Lend Order' },
  { value: 'SettleLendOrder', label: 'Settle Lend Order' },
  { value: 'LiquidateOrder', label: 'Liquidate Order' },
];

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [programTypeFilter, setProgramTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, limit, moduleFilter, programTypeFilter, statusFilter],
    queryFn: () =>
      getTransactions(page, limit, {
        module: moduleFilter || undefined,
        programType: moduleFilter === 'zkos' && programTypeFilter ? programTypeFilter : undefined,
        status: statusFilter as 'success' | 'failed' | undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <ArrowRightLeft className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-text-secondary text-sm">
            Browse and filter recent network activity
          </p>
        </div>
      </div>

      {/* Module: Table + Controls */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Transactions</h2>
            <p className="text-text-secondary text-sm">
              {isLoading
                ? 'Loading…'
                : data
                  ? `Showing ${data.data.length} of ${data.pagination.total.toLocaleString()}`
                  : '—'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setProgramTypeFilter(''); // Reset program type when module changes
                setPage(1);
              }}
              className="bg-background-tertiary/60 border border-card-border rounded-[10.5px] px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            >
              {moduleFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            {moduleFilter === 'zkos' && (
              <select
                value={programTypeFilter}
                onChange={(e) => {
                  setProgramTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-background-tertiary/60 border border-card-border rounded-[10.5px] px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              >
                {programTypeFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-background-tertiary/60 border border-card-border rounded-[10.5px] px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
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
        ) : data?.data?.length ? (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {data.data.map((tx) => (
                <Link
                  key={tx.hash}
                  href={`/txs/${tx.hash}`}
                  className="block p-4 rounded-[10.5px] border border-card-border bg-black/30 hover:bg-background-tertiary/30 transition-colors"
                >
                  <div className="font-mono text-sm text-primary-light truncate">
                    {tx.hash.substring(0, 16)}...
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={`/blocks/${tx.blockHeight}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-secondary hover:text-primary-light text-sm"
                    >
                      #{tx.blockHeight.toLocaleString()}
                    </Link>
                    <span className="badge badge-primary">
                      {tx.type.split('.').pop()?.replace('Msg', '')}
                    </span>
                    {tx.programType && (
                      <span className="badge bg-primary/20 text-primary-light text-xs">
                        {tx.programType === 'SettleTraderOrderNegativeMarginDifference' ? 'SettleTraderOrder' : tx.programType}
                      </span>
                    )}
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
                    <span className="flex items-center gap-1 text-text-secondary text-sm">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hash</th>
                    <th>Block</th>
                    <th>Type</th>
                    <th>ZKOS Type</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((tx) => (
                    <tr key={tx.hash}>
                      <td>
                        <Link href={`/txs/${tx.hash}`} className="font-mono text-sm">
                          {tx.hash.substring(0, 16)}...
                        </Link>
                      </td>
                      <td>
                        <Link href={`/blocks/${tx.blockHeight}`} className="text-text-secondary hover:text-primary-light">
                          #{tx.blockHeight.toLocaleString()}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {tx.type.split('.').pop()?.replace('Msg', '')}
                        </span>
                      </td>
                      <td>
                        {tx.programType ? (
                          <span className="badge bg-primary/20 text-primary-light">{tx.programType === 'SettleTraderOrderNegativeMarginDifference' ? 'SettleTraderOrder' : tx.programType}</span>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
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
                          {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center text-text-secondary py-10">
            No transactions found for the selected filters
          </div>
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
