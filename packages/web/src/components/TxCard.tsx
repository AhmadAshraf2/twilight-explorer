import Link from 'next/link';
import { ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Transaction } from '@/lib/api';
import clsx from 'clsx';

interface TxCardProps {
  tx: Transaction;
}

function getMessageModule(type: string): string {
  if (type.includes('.bridge.')) return 'bridge';
  if (type.includes('.forks.')) return 'forks';
  if (type.includes('.volt.')) return 'volt';
  if (type.includes('.zkos.')) return 'zkos';
  return 'cosmos';
}

function formatMessageType(type: string): string {
  const parts = type.split('.');
  const name = parts[parts.length - 1];
  return name.replace(/^Msg/, '');
}

export function TxCard({ tx }: TxCardProps) {
  const module = getMessageModule(tx.type);
  const typeName = formatMessageType(tx.type);

  return (
    <div className="card hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'p-2 rounded-lg',
              module === 'bridge' && 'bg-accent-blue/20',
              module === 'forks' && 'bg-accent-orange/20',
              module === 'volt' && 'bg-accent-yellow/20',
              module === 'zkos' && 'bg-primary/20',
              module === 'cosmos' && 'bg-text-muted/20'
            )}
          >
            <ArrowRightLeft
              className={clsx(
                'w-5 h-5',
                module === 'bridge' && 'text-accent-blue',
                module === 'forks' && 'text-accent-orange',
                module === 'volt' && 'text-accent-yellow',
                module === 'zkos' && 'text-primary-light',
                module === 'cosmos' && 'text-text-muted'
              )}
            />
          </div>
          <div>
            <Link
              href={`/txs/${tx.hash}`}
              className="font-mono text-sm text-white hover:text-primary-light"
            >
              {tx.hash.substring(0, 16)}...
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={clsx(
                  'badge',
                  module === 'bridge' && 'bg-accent-blue/20 text-accent-blue',
                  module === 'forks' && 'bg-accent-orange/20 text-accent-orange',
                  module === 'volt' && 'bg-accent-yellow/20 text-accent-yellow',
                  module === 'zkos' && 'bg-primary/20 text-primary-light',
                  module === 'cosmos' && 'bg-text-muted/20 text-text-muted'
                )}
              >
                {typeName}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            {tx.status === 'success' ? (
              <CheckCircle className="w-4 h-4 text-accent-green" />
            ) : (
              <XCircle className="w-4 h-4 text-accent-red" />
            )}
            <span
              className={clsx(
                'text-sm',
                tx.status === 'success' ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {tx.status}
            </span>
          </div>
          <div className="flex items-center gap-1 text-text-secondary text-xs mt-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}
