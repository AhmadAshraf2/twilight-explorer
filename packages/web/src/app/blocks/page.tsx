'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Blocks, Clock } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { LoadingTable } from '@/components/Loading';
import { getBlocks } from '@/lib/api';

export default function BlocksPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['blocks', page, limit],
    queryFn: () => getBlocks(page, limit),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Blocks className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Blocks</h1>
          <p className="text-text-secondary text-sm">Browse recent blocks on the Twilight network</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Blocks</h2>
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
                  <th>Height</th>
                  <th>Hash</th>
                  <th>Transactions</th>
                  <th>Gas Used</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((block) => (
                  <tr key={block.height}>
                    <td>
                      <Link href={`/blocks/${block.height}`} className="font-medium">
                        #{block.height.toLocaleString()}
                      </Link>
                    </td>
                    <td>
                      <span className="font-mono text-text-secondary text-sm">
                        {block.hash.substring(0, 16)}...
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{block.txCount}</span>
                    </td>
                    <td className="text-text-secondary">
                      {parseInt(block.gasUsed).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-text-secondary text-sm">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-10">No blocks found</div>
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
