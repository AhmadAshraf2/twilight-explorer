'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Code, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getTransactionsByScript } from '@/lib/api';
import clsx from 'clsx';

export default function ScriptPage() {
  const params = useParams();
  const scriptAddress = params.address as string;
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['script-transactions', scriptAddress, page, limit],
    queryFn: () => getTransactionsByScript(scriptAddress, page, limit),
    enabled: !!scriptAddress,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/txs"
          className="p-2 bg-background-tertiary hover:bg-background-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Code className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Script Transactions</h1>
          <p className="text-text-secondary text-sm font-mono truncate">
            {scriptAddress}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : isError || !data ? (
        <div className="card p-8 text-center">
          <p className="text-text-secondary">
            Failed to load transactions. Please try again.
          </p>
        </div>
      ) : data.data.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-text-secondary">
            No transactions found for this script address.
          </p>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <p className="text-text-secondary text-sm">
              Found <span className="text-white font-medium">{data?.pagination.total}</span> transactions
              referencing this script
            </p>
          </div>

          <div className="table-container">
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
                      {tx.programType ? (
                        <span className="badge bg-purple-500/20 text-purple-400">
                          {tx.programType}
                        </span>
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
