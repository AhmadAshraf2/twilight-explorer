'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Zap,
  Users,
  Coins,
} from 'lucide-react';
import { Loading } from '@/components/Loading';
import { getAccount, getAccountTransactions } from '@/lib/api';
import { ArrowRightLeft, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

function formatSatoshis(satoshis: string): string {
  const sats = parseInt(satoshis);
  if (isNaN(sats)) return '0 sats';
  return sats.toLocaleString() + ' sats';
}

// Format denom for display
function formatDenom(denom: string): string {
  // Common denom mappings
  if (denom === 'nyks') return 'NYKS';
  if (denom === 'unyks') return 'uNYKS';
  if (denom === 'sats') return 'sats';
  return denom.toUpperCase();
}

// Format balance amount with appropriate decimals
function formatBalance(amount: string, denom: string): string {
  const num = BigInt(amount);
  // If it's unyks (micro), convert to nyks (divide by 10^6)
  if (denom === 'unyks') {
    const whole = num / BigInt(1_000_000);
    const frac = num % BigInt(1_000_000);
    if (frac === BigInt(0)) {
      return whole.toLocaleString();
    }
    return `${whole.toLocaleString()}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
  }
  return BigInt(amount).toLocaleString();
}

// Get short message type name
function getShortType(type: string): string {
  // Extract the message name from the full type path
  const parts = type.split('.');
  const msgType = parts[parts.length - 1];
  // Remove 'Msg' prefix if present
  return msgType.replace(/^Msg/, '');
}

export default function AccountDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['account', address],
    queryFn: () => getAccount(address),
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ['account-transactions', address],
    queryFn: () => getAccountTransactions(address, 1, 50),
    enabled: !!address,
  });

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Account</h1>
        <p className="text-text-secondary">Failed to load account data</p>
      </div>
    );
  }

  const hasBalances = !!data?.balances && data.balances.length > 0;
  const hasAccount = !!data?.account;
  const hasClearing = !!data?.clearingAccount;
  const hasDeposits = !!data?.deposits && data.deposits.length > 0;
  const hasWithdrawals = !!data?.withdrawals && data.withdrawals.length > 0;
  const hasZkos = !!data?.zkosOperations && data.zkosOperations.length > 0;
  const hasFragmentSignerActivity = !!data?.fragmentSigners && data.fragmentSigners.length > 0;
  const hasTxs = !!txData?.data && txData.data.length > 0;
  const hasAnyActivity =
    hasTxs || hasDeposits || hasWithdrawals || hasZkos || hasFragmentSignerActivity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <User className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Account</h1>
          <p className="text-text-secondary text-sm font-mono break-all">
            {address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Snapshot rail */}
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Balances */}
            {hasBalances && (
              <div className="card">
                <h2 className="card-header flex items-center gap-2">
                  <Coins className="w-5 h-5 text-accent-yellow" />
                  Balances
                </h2>
                <div className="flex flex-wrap gap-3">
                  {data!.balances.map((balance, idx) => (
                    <div
                      key={idx}
                      className="bg-background-tertiary/40 rounded-[7px] px-4 py-3 border border-card-border/50"
                    >
                      <p className="text-text-secondary text-xs uppercase mb-1">
                        {formatDenom(balance.denom)}
                      </p>
                      <p className="text-white text-xl font-semibold">
                        {formatBalance(balance.amount, balance.denom)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Overview */}
            {hasAccount && (
              <div className="card">
                <h2 className="card-header">Activity Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Transactions</p>
                    <p className="text-white font-medium">{data!.account!.txCount}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">First Seen</p>
                    <p className="text-white font-medium">
                      {format(new Date(data!.account!.firstSeen), 'PP')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Clearing Account */}
            {hasClearing && (
              <div className="card">
                <h2 className="card-header flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Clearing Account
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {data!.clearingAccount.btcDepositAddress && (
                    <div>
                      <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">BTC Deposit Address</p>
                      <p className="text-white font-mono text-sm break-all">
                        {data!.clearingAccount.btcDepositAddress}
                      </p>
                    </div>
                  )}
                  {data!.clearingAccount.btcWithdrawAddress && (
                    <div>
                      <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">BTC Withdraw Address</p>
                      <p className="text-white font-mono text-sm break-all">
                        {data!.clearingAccount.btcWithdrawAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main activity */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px] flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-light" />
                Transactions
              </h2>
              <span className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
                {txData?.pagination?.total?.toLocaleString?.() ?? (hasTxs ? txData!.data.length : 0)}
              </span>
            </div>

            {hasTxs ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Hash</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Block</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txData!.data.map((tx: any) => (
                      <tr key={tx.hash}>
                        <td>
                          <Link href={`/txs/${tx.hash}`} className="font-mono text-sm">
                            {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 6)}
                          </Link>
                        </td>
                        <td>
                          <span className="badge badge-info text-xs">{getShortType(tx.type)}</span>
                        </td>
                        <td>
                          <span
                            className={clsx(
                              'badge text-xs',
                              tx.status === 'success' ? 'badge-success' : 'badge-error'
                            )}
                          >
                            {tx.status === 'success' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <Link href={`/blocks/${tx.blockHeight}`} className="text-primary-light hover:text-primary">
                            #{tx.blockHeight.toLocaleString()}
                          </Link>
                        </td>
                        <td className="text-text-secondary text-sm">
                          {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-10">No transactions found for this address</div>
            )}

            {txData?.pagination?.totalPages > 1 && (
              <div className="mt-4 text-center text-text-secondary text-sm">
                Showing {txData.data.length} of {txData.pagination.total} transactions
              </div>
            )}
          </div>

          {/* Protocol details (secondary band) */}
          {(hasDeposits || hasWithdrawals || hasZkos || hasFragmentSignerActivity) && (
            <div className="space-y-6">
              {hasDeposits && (
                <div className="card">
                  <h2 className="card-header flex items-center gap-2">
                    <ArrowDownToLine className="w-5 h-5 text-accent-green" />
                    Recent Deposits ({data!.deposits.length})
                  </h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>BTC Height</th>
                          <th>Block</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.deposits.map((deposit: any) => (
                          <tr key={deposit.id}>
                            <td>
                              <span className="text-accent-green font-medium">
                                {formatSatoshis(deposit.depositAmount)}
                              </span>
                            </td>
                            <td className="font-mono text-text-secondary">
                              {parseInt(deposit.btcHeight).toLocaleString()}
                            </td>
                            <td>
                              <Link href={`/blocks/${deposit.blockHeight}`} className="text-primary-light hover:text-primary">
                                #{deposit.blockHeight.toLocaleString()}
                              </Link>
                            </td>
                            <td className="text-text-secondary text-sm">
                              {formatDistanceToNow(new Date(deposit.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hasWithdrawals && (
                <div className="card">
                  <h2 className="card-header flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-accent-orange" />
                    Recent Withdrawals ({data!.withdrawals.length})
                  </h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>BTC Address</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.withdrawals.map((withdrawal: any) => (
                          <tr key={withdrawal.id}>
                            <td>
                              <span className="text-accent-orange font-medium">
                                {formatSatoshis(withdrawal.withdrawAmount)}
                              </span>
                            </td>
                            <td className="font-mono text-text-secondary text-sm">
                              {withdrawal.withdrawAddress.substring(0, 20)}...
                            </td>
                            <td>
                              <span className="badge badge-warning">{withdrawal.status}</span>
                            </td>
                            <td className="text-text-secondary text-sm">
                              {formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hasZkos && (
                <div className="card">
                  <h2 className="card-header flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary-light" />
                    zkOS Operations ({data!.zkosOperations.length})
                  </h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Block</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.zkosOperations.map((op: any) => (
                          <tr key={op.id}>
                            <td>
                              <span className={`badge ${op.mintOrBurn ? 'badge-success' : 'badge-error'}`}>
                                {op.mintOrBurn ? 'Mint' : 'Burn'}
                              </span>
                            </td>
                            <td className="font-medium">{formatSatoshis(op.btcValue)}</td>
                            <td>
                              <Link href={`/blocks/${op.blockHeight}`} className="text-primary-light hover:text-primary">
                                #{op.blockHeight.toLocaleString()}
                              </Link>
                            </td>
                            <td className="text-text-secondary text-sm">
                              {formatDistanceToNow(new Date(op.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hasFragmentSignerActivity && (
                <div className="card">
                  <h2 className="card-header flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-yellow" />
                    Fragment Signer Activity ({data!.fragmentSigners.length})
                  </h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Fragment ID</th>
                          <th>Application Fee</th>
                          <th>Fee Bips</th>
                          <th>Status</th>
                          <th>Block</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data!.fragmentSigners.map((signer: any) => (
                          <tr key={signer.id}>
                            <td>
                              <span className="font-mono text-accent-yellow">Fragment #{signer.fragmentId}</span>
                            </td>
                            <td className="font-medium">{formatSatoshis(signer.applicationFee)}</td>
                            <td className="text-text-secondary">{signer.feeBips} bips</td>
                            <td>
                              <span
                                className={`badge ${
                                  signer.status === 'accepted'
                                    ? 'badge-success'
                                    : signer.status === 'rejected'
                                      ? 'badge-error'
                                      : 'badge-warning'
                                }`}
                              >
                                {signer.status}
                              </span>
                            </td>
                            <td>
                              <Link href={`/blocks/${signer.blockHeight}`} className="text-primary-light hover:text-primary">
                                #{signer.blockHeight.toLocaleString()}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {!hasAccount && !hasBalances && !hasClearing && !hasAnyActivity && (
        <div className="card text-center py-10">
          <p className="text-text-secondary">No activity found for this address</p>
        </div>
      )}
    </div>
  );
}
