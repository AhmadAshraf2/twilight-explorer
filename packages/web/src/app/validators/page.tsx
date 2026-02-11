'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, ShieldCheck, Copy, Check, Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Network } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

import { LoadingTable, LoadingCard } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import {
  getDelegates,
  getValidatorsBasic,
  getValidatorCount,
  getValidatorBlockStats,
  type DelegateKey,
  type LcdStakingValidator,
} from '@/lib/api';

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

// Format tokens (voting power) - assuming base units (divide by 10^6 for nyks)
function formatTokens(tokens: string): string {
  const num = BigInt(tokens);
  const nyks = Number(num) / 1_000_000; // Convert from unyks to nyks
  
  if (nyks >= 1_000_000_000) {
    return `${(nyks / 1_000_000_000).toFixed(2)}B`;
  } else if (nyks >= 1_000_000) {
    return `${(nyks / 1_000_000).toFixed(2)}M`;
  } else if (nyks >= 1_000) {
    return `${(nyks / 1_000).toFixed(2)}K`;
  } else {
    return nyks.toFixed(2);
  }
}

function short(addr: string, head = 12, tail = 6) {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

type SortField = 'votingPower' | 'blocks' | 'commission' | 'moniker';
type SortDirection = 'asc' | 'desc';

export default function ValidatorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('votingPower');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: lcdData, isLoading: validatorsLoading, error: validatorsError } = useQuery({
    queryKey: ['validators-basic', 'BOND_STATUS_BONDED', 200],
    queryFn: () => getValidatorsBasic(200, 'BOND_STATUS_BONDED'),
    staleTime: 600_000, // 10 minutes (matches cache TTL)
    refetchInterval: false, // No auto-refetch, rely on cache
  });

  const { data: totalValidators } = useQuery({
    queryKey: ['validatorCount', 'BOND_STATUS_BONDED'],
    queryFn: () => getValidatorCount('BOND_STATUS_BONDED'),
    staleTime: 600_000,
    refetchInterval: false,
  });

  const { data: delegates, isLoading: delegatesLoading } = useQuery({
    queryKey: ['delegates'],
    queryFn: getDelegates,
    staleTime: 600_000, // 10 minutes
    refetchInterval: false, // No auto-refetch
  });

  const delegateByValidator = useMemo(() => {
    const map = new Map<string, DelegateKey>();
    for (const d of delegates ?? []) map.set(d.validatorAddress, d);
    return map;
  }, [delegates]);

  // Calculate stats
  const stats = useMemo(() => {
    const validators = lcdData?.validators ?? [];
    const totalVotingPower = validators.reduce((sum, v) => sum + BigInt(v.tokens || '0'), BigInt(0));
    const jailedCount = validators.filter((v) => v.jailed).length;
    const activeCount = validators.length - jailedCount;

    return {
      total: totalValidators ?? validators.length,
      active: activeCount,
      jailed: jailedCount,
      totalVotingPower: formatTokens(totalVotingPower.toString()),
    };
  }, [lcdData, totalValidators]);

  // Process and sort validators
  const processedValidators = useMemo(() => {
    const validators = lcdData?.validators ?? [];
    
    return validators.map((v) => ({
      validator: v,
      delegate: delegateByValidator.get(v.operator_address),
      votingPower: BigInt(v.tokens || '0'),
    }));
  }, [lcdData, delegateByValidator]);

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let filtered = processedValidators;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ validator }) => {
        const moniker = validator.description?.moniker?.toLowerCase() || '';
        const address = validator.operator_address.toLowerCase();
        return moniker.includes(query) || address.includes(query);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'votingPower':
          aVal = a.votingPower;
          bVal = b.votingPower;
          break;
        case 'blocks':
          // We'll sort by voting power as proxy for blocks (can enhance later with actual block stats)
          aVal = a.votingPower;
          bVal = b.votingPower;
          break;
        case 'commission':
          aVal = Number(a.validator.commission?.commission_rates?.rate || '0');
          bVal = Number(b.validator.commission?.commission_rates?.rate || '0');
          break;
        case 'moniker':
          aVal = a.validator.description?.moniker || '';
          bVal = b.validator.description?.moniker || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [processedValidators, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={clsx(
          'flex items-center gap-1 hover:text-white transition-colors',
          isActive ? 'text-white' : 'text-text-secondary'
        )}
      >
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Network className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Validators</h1>
          <p className="text-text-secondary text-sm">Network validators and their performance metrics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {validatorsLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Validators"
              value={stats.total}
              icon={Users}
              badge="Bonded"
            />
            <StatsCard
              title="Active Validators"
              value={stats.active}
              icon={Network}
              badge="Online"
            />
            <StatsCard
              title="Jailed Validators"
              value={stats.jailed}
              icon={ShieldCheck}
              badge="Inactive"
            />
            <StatsCard
              title="Total Voting Power"
              value={`${stats.totalVotingPower} NYKS`}
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by moniker or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-tertiary/30 border border-card-border rounded-[7px] text-white placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="text-sm text-text-secondary">
            Showing {filteredAndSorted.length} of {processedValidators.length} validators
          </div>
        </div>
      </div>

      {/* Validators Table */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Bonded Validators</h2>
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
        ) : filteredAndSorted.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <SortButton field="votingPower">Rank</SortButton>
                  </th>
                  <th>
                    <SortButton field="moniker">Moniker</SortButton>
                  </th>
                  <th>Operator</th>
                  <th>
                    <SortButton field="votingPower">Voting Power</SortButton>
                  </th>
                  <th>Status</th>
                  <th>
                    <SortButton field="commission">Commission</SortButton>
                  </th>
                  <th>Custody</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map(({ validator, delegate }, index) => (
                  <ValidatorRow
                    key={validator.operator_address}
                    validator={validator}
                    delegate={delegate}
                    rank={index + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-10">
            {searchQuery ? 'No validators match your search' : 'No validators found'}
          </div>
        )}
      </div>
    </div>
  );
}

function ValidatorRow({
  validator,
  delegate,
  rank,
}: {
  validator: LcdStakingValidator;
  delegate?: DelegateKey;
  rank: number;
}) {
  const moniker = validator.description?.moniker || '—';
  const status = validator.status || '—';
  const commission = formatRate(validator.commission?.commission_rates?.rate);
  const votingPower = formatTokens(validator.tokens || '0');
  const website = validator.description?.website;

  return (
    <tr>
      <td className="text-text-secondary font-mono text-sm">#{rank}</td>
      <td className="font-medium">
        <div className="flex items-center gap-2">
          <Link
            href={`/validators/${validator.operator_address}`}
            className="text-white hover:text-primary-light transition-colors"
          >
            {moniker}
          </Link>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary-light transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/${validator.operator_address}`}
            className="font-mono text-sm text-text-secondary hover:text-primary-light transition-colors"
          >
            {short(validator.operator_address, 16, 8)}
          </Link>
          <CopyButton text={validator.operator_address} />
        </div>
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-mono text-sm text-white">{votingPower} NYKS</span>
        </div>
      </td>
      <td>
        <span
          className={clsx(
            'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border',
            status === 'BOND_STATUS_BONDED'
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : validator.jailed
              ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
              : 'bg-white/5 text-text-secondary border-white/10'
          )}
        >
          {validator.jailed
            ? 'Jailed'
            : status === 'BOND_STATUS_BONDED'
            ? 'Bonded'
            : status.replace('BOND_STATUS_', '').toLowerCase()}
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
