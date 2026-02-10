'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, ShieldCheck, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

import { LoadingTable } from '@/components/Loading';
import { getDelegates, getValidatorsBasic, type DelegateKey, type LcdStakingValidator } from '@/lib/api';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-background-tertiary/30 rounded-[3.5px] transition-colors"
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-muted hover:text-white" />}
    </button>
  );
}

function formatRate(rate?: string) {
  if (!rate) return '—';
  const n = Number(rate);
  if (Number.isNaN(n)) return rate;
  return `${(n * 100).toFixed(2)}%`;
}

function short(addr: string, head = 12, tail = 6) {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export default function ValidatorsPage() {
  const { data: lcdData, isLoading: validatorsLoading, error: validatorsError } = useQuery({
    queryKey: ['validators-basic', 'BOND_STATUS_BONDED', 200],
    queryFn: () => getValidatorsBasic(200, 'BOND_STATUS_BONDED'),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: delegates, isLoading: delegatesLoading } = useQuery({
    queryKey: ['delegates'],
    queryFn: getDelegates,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const delegateByValidator = useMemo(() => {
    const map = new Map<string, DelegateKey>();
    for (const d of delegates ?? []) map.set(d.validatorAddress, d);
    return map;
  }, [delegates]);

  const rows = useMemo(() => {
    const validators = lcdData?.validators ?? [];
    return validators.map((v) => ({
      validator: v,
      delegate: delegateByValidator.get(v.operator_address),
    }));
  }, [lcdData, delegateByValidator]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Users className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Validators</h1>
          <p className="text-text-secondary text-sm">Basic validator set (bonded) fetched from LCD</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Bonded Validators</h2>
          <div className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
            Total:{' '}
            <span className="text-text-secondary font-mono">
              {(lcdData?.pagination?.total ? parseInt(lcdData.pagination.total, 10) : rows.length).toLocaleString()}
            </span>
          </div>
        </div>

        {validatorsLoading || delegatesLoading ? (
          <LoadingTable rows={10} />
        ) : validatorsError ? (
          <div className="text-center text-text-secondary py-10">
            Failed to load validators.{' '}
            <span className="text-text-muted">
              {(validatorsError as Error)?.message ? `(${(validatorsError as Error).message})` : ''}
            </span>
          </div>
        ) : rows.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Moniker</th>
                  <th>Operator</th>
                  <th>Status</th>
                  <th>Commission</th>
                  <th>Custody</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ validator, delegate }) => (
                  <ValidatorRow key={validator.operator_address} validator={validator} delegate={delegate} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-10">No validators returned by LCD</div>
        )}
      </div>
    </div>
  );
}

function ValidatorRow({
  validator,
  delegate,
}: {
  validator: LcdStakingValidator;
  delegate?: DelegateKey;
}) {
  const moniker = validator.description?.moniker || '—';
  const status = validator.status || '—';
  const commission = formatRate(validator.commission?.commission_rates?.rate);

  return (
    <tr>
      <td className="font-medium text-white">{moniker}</td>
      <td>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-secondary">{short(validator.operator_address, 16, 8)}</span>
          <CopyButton text={validator.operator_address} />
        </div>
      </td>
      <td>
        <span
          className={clsx(
            'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border',
            status === 'BOND_STATUS_BONDED'
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : 'bg-white/5 text-text-secondary border-white/10'
          )}
        >
          {status === 'BOND_STATUS_BONDED' ? 'Bonded' : status.replace('BOND_STATUS_', '').toLowerCase()}
        </span>
      </td>
      <td className="text-text-secondary font-mono text-sm">{commission}</td>
      <td>
        {delegate ? (
          <Link
            href="/fragments"
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15 transition-colors"
            title="This validator has custody delegate keys registered (forks module)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Custodian keys
          </Link>
        ) : (
          <span className="text-text-muted text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

