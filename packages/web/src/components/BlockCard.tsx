import Link from 'next/link';
import { Blocks, Clock, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Block } from '@/lib/api';

interface BlockCardProps {
  block: Block;
}

export function BlockCard({ block }: BlockCardProps) {
  return (
    <div className="card card-hover rounded-[10.5px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[7px] bg-background-tertiary/30 border border-card-border flex items-center justify-center">
            <Blocks className="w-5 h-5 text-primary-light" />
          </div>
          <div>
            <Link
              href={`/blocks/${block.height}`}
              className="font-mono text-[12.3px] leading-[18px] text-white hover:text-primary-light"
            >
              #{block.height.toLocaleString()}
            </Link>
            <div className="flex items-center gap-2 text-text-secondary text-sm mt-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-medium text-sm">
            {block.txCount} {block.txCount === 1 ? 'tx' : 'txs'}
          </div>
          <div className="text-text-muted text-xs mt-1 font-mono truncate max-w-[120px]">
            {block.hash.substring(0, 12)}...
          </div>
        </div>
      </div>
    </div>
  );
}
