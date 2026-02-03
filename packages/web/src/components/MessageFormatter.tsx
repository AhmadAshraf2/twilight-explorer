'use client';

import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Users,
  UserCheck,
  Key,
  Eye,
  Zap,
  Coins,
  Send,
  FileSignature,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { ZkosTransactionViewer } from './ZkosTransactionViewer';

// Blockchain explorer base URL
const BTC_EXPLORER_URL = 'https://www.blockchain.com/explorer';

// Helper to format satoshis - show raw sats value
function formatSatoshis(satoshis: string | number): string {
  const sats = typeof satoshis === 'string' ? parseInt(satoshis) : satoshis;
  if (isNaN(sats)) return '0 sats';
  return `${sats.toLocaleString()} sats`;
}

// Helper to format coin amount - show raw values with denomination
function formatCoinAmount(amount: string | number, denom: string): string {
  const value = typeof amount === 'string' ? parseInt(amount) : amount;
  if (isNaN(value)) return `0 ${denom}`;
  return `${value.toLocaleString()} ${denom}`;
}

// Helper to truncate address for display
function truncateAddress(address: string, start = 12, end = 8): string {
  if (!address || address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// BTC Address Link - external link to blockchain.com
function BtcAddressLink({
  address,
  truncate = true,
  className = '',
}: {
  address: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!address) return <span className="text-text-muted">-</span>;

  return (
    <a
      href={`${BTC_EXPLORER_URL}/addresses/btc/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'font-mono text-accent-orange hover:text-accent-yellow hover:underline inline-flex items-center gap-1',
        className
      )}
      title={`View ${address} on blockchain.com`}
    >
      {truncate ? truncateAddress(address, 10, 6) : address}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

// BTC Block Height Link - external link to blockchain.com
function BtcBlockLink({
  height,
  className = '',
}: {
  height: string | number;
  className?: string;
}) {
  const blockHeight = typeof height === 'string' ? parseInt(height) : height;
  if (isNaN(blockHeight)) return <span className="text-text-muted">-</span>;

  return (
    <a
      href={`${BTC_EXPLORER_URL}/blocks/btc/${blockHeight}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'font-mono text-accent-orange hover:text-accent-yellow hover:underline inline-flex items-center gap-1',
        className
      )}
      title={`View BTC block ${blockHeight.toLocaleString()} on blockchain.com`}
    >
      {blockHeight.toLocaleString()}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

// BTC Hash Link - external link to blockchain.com (block hash)
function BtcHashLink({
  hash,
  truncate = true,
  className = '',
}: {
  hash: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!hash) return <span className="text-text-muted">-</span>;

  return (
    <a
      href={`${BTC_EXPLORER_URL}/blocks/btc/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'font-mono text-accent-orange hover:text-accent-yellow hover:underline inline-flex items-center gap-1',
        className
      )}
      title={`View block ${hash} on blockchain.com`}
    >
      {truncate ? truncateAddress(hash, 12, 8) : hash}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

// BTC Transaction Link - external link to blockchain.com
function BtcTxLink({
  txid,
  truncate = true,
  className = '',
}: {
  txid: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!txid) return <span className="text-text-muted">-</span>;

  return (
    <a
      href={`${BTC_EXPLORER_URL}/transactions/btc/${txid}`}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'font-mono text-accent-orange hover:text-accent-yellow hover:underline inline-flex items-center gap-1',
        className
      )}
      title={`View transaction ${txid} on blockchain.com`}
    >
      {truncate ? truncateAddress(txid, 12, 8) : txid}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

// Address Link component
function AddressLink({
  address,
  truncate = true,
  className = '',
}: {
  address: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!address) return <span className="text-text-muted">-</span>;

  return (
    <Link
      href={`/accounts/${address}`}
      className={clsx(
        'font-mono text-primary-light hover:text-primary hover:underline',
        className
      )}
      title={address}
    >
      {truncate ? truncateAddress(address) : address}
    </Link>
  );
}

// Fragment Link component
function FragmentLink({ fragmentId }: { fragmentId: string | number }) {
  return (
    <span className="font-mono text-accent-yellow">
      Fragment #{fragmentId.toString()}
    </span>
  );
}

// Data row component
function DataRow({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border/50 last:border-0', className)}>
      <span className="text-text-secondary text-sm min-w-[140px] shrink-0">{label}</span>
      <span className="text-white break-all">{children}</span>
    </div>
  );
}

// Message type configs
interface MessageConfig {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  render: (data: any) => React.ReactNode;
}

const messageConfigs: Record<string, MessageConfig> = {
  // Bridge Module
  '/twilightproject.nyks.bridge.MsgConfirmBtcDeposit': {
    icon: ArrowDownToLine,
    iconColor: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    title: 'Confirm BTC Deposit',
    render: (data) => (
      <>
        <DataRow label="Deposit Amount">
          <span className="text-accent-green font-semibold">{formatSatoshis(data.depositAmount)}</span>
        </DataRow>
        <DataRow label="Twilight Address">
          <AddressLink address={data.twilightDepositAddress} truncate={false} />
        </DataRow>
        <DataRow label="Reserve Address">
          <BtcAddressLink address={data.reserveAddress} truncate={false} />
        </DataRow>
        <DataRow label="Oracle Address">
          <AddressLink address={data.oracleAddress} />
        </DataRow>
        <DataRow label="BTC Height">
          <BtcBlockLink height={data.btcHeight} />
        </DataRow>
        {data.btcHash && (
          <DataRow label="BTC Tx Hash">
            <BtcTxLink txid={data.btcHash} truncate={false} />
          </DataRow>
        )}
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgRegisterBtcDepositAddress': {
    icon: Wallet,
    iconColor: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    title: 'Register Deposit Address',
    render: (data) => (
      <>
        <DataRow label="BTC Deposit Address">
          <BtcAddressLink address={data.btcDepositAddress} truncate={false} />
        </DataRow>
        <DataRow label="Twilight Address">
          <AddressLink address={data.twilightAddress} truncate={false} />
        </DataRow>
        <DataRow label="Test Amount">
          {formatSatoshis(data.btcSatoshiTestAmount)}
        </DataRow>
        <DataRow label="Staking Amount">
          {formatSatoshis(data.twilightStakingAmount)}
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgWithdrawBtcRequest': {
    icon: ArrowUpFromLine,
    iconColor: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    title: 'Withdraw BTC Request',
    render: (data) => (
      <>
        <DataRow label="Withdraw Amount">
          <span className="text-accent-orange font-semibold">{formatSatoshis(data.withdrawAmount)}</span>
        </DataRow>
        <DataRow label="From (Twilight)">
          <AddressLink address={data.twilightAddress} truncate={false} />
        </DataRow>
        <DataRow label="To (BTC)">
          <BtcAddressLink address={data.withdrawAddress} truncate={false} />
        </DataRow>
        <DataRow label="Reserve ID">
          <span className="font-mono">{data.reserveId}</span>
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgRegisterReserveAddress': {
    icon: Key,
    iconColor: 'text-primary-light',
    bgColor: 'bg-primary/10',
    title: 'Register Reserve Address',
    render: (data) => (
      <>
        <DataRow label="Reserve Address">
          <BtcAddressLink address={data.reserveAddress} truncate={false} />
        </DataRow>
        <DataRow label="Reserve Script">
          <span className="font-mono text-xs break-all">{data.reserveScript}</span>
        </DataRow>
        <DataRow label="Judge Address">
          <AddressLink address={data.judgeAddress} />
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgBootstrapFragment': {
    icon: Users,
    iconColor: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/10',
    title: 'Bootstrap Fragment',
    render: (data) => (
      <>
        <DataRow label="Judge Address">
          <AddressLink address={data.judgeAddress} truncate={false} />
        </DataRow>
        <DataRow label="Number of Signers">
          <span className="font-semibold">{data.numOfSigners}</span>
        </DataRow>
        <DataRow label="Threshold">
          <span className="font-semibold">{data.threshold}</span>
        </DataRow>
        <DataRow label="Application Fee">
          {formatSatoshis(data.signerApplicationFee)}
        </DataRow>
        <DataRow label="Fee Bips">
          <span>{data.fragmentFeeBips} bips</span>
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgSweepProposal': {
    icon: RefreshCw,
    iconColor: 'text-primary-light',
    bgColor: 'bg-primary/10',
    title: 'Sweep Proposal',
    render: (data) => (
      <>
        <DataRow label="Reserve ID">
          <span className="font-mono">{data.reserveId}</span>
        </DataRow>
        <DataRow label="Round ID">
          <span className="font-mono">{data.roundId}</span>
        </DataRow>
        <DataRow label="New Reserve Address">
          <BtcAddressLink address={data.newReserveAddress} truncate={false} />
        </DataRow>
        <DataRow label="Judge Address">
          <AddressLink address={data.judgeAddress} />
        </DataRow>
        <DataRow label="BTC Block">
          <BtcBlockLink height={data.btcBlockNumber} />
        </DataRow>
        <DataRow label="Relay Capacity">
          {formatSatoshis(data.btcRelayCapacityValue)}
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgSignSweep': {
    icon: FileSignature,
    iconColor: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    title: 'Sign Sweep',
    render: (data) => (
      <>
        <DataRow label="Reserve ID">
          <span className="font-mono">{data.reserveId}</span>
        </DataRow>
        <DataRow label="Round ID">
          <span className="font-mono">{data.roundId}</span>
        </DataRow>
        <DataRow label="Signer Address">
          <AddressLink address={data.signerAddress} truncate={false} />
        </DataRow>
        <DataRow label="Signer Public Key">
          <span className="font-mono text-xs break-all">{data.signerPublicKey}</span>
        </DataRow>
        {data.sweepSignatures && data.sweepSignatures.length > 0 && (
          <DataRow label="Signatures">
            <span className="text-accent-green">{data.sweepSignatures.length} signature(s)</span>
          </DataRow>
        )}
      </>
    ),
  },

  '/twilightproject.nyks.bridge.MsgSignRefund': {
    icon: FileSignature,
    iconColor: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    title: 'Sign Refund',
    render: (data) => (
      <>
        <DataRow label="Reserve ID">
          <span className="font-mono">{data.reserveId}</span>
        </DataRow>
        <DataRow label="Round ID">
          <span className="font-mono">{data.roundId}</span>
        </DataRow>
        <DataRow label="Signer Address">
          <AddressLink address={data.signerAddress} truncate={false} />
        </DataRow>
        {data.refundSignatures && data.refundSignatures.length > 0 && (
          <DataRow label="Signatures">
            <span className="text-accent-orange">{data.refundSignatures.length} signature(s)</span>
          </DataRow>
        )}
      </>
    ),
  },

  // Forks Module
  '/twilightproject.nyks.forks.MsgSetDelegateAddresses': {
    icon: Key,
    iconColor: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    title: 'Set Delegate Addresses',
    render: (data) => (
      <>
        <DataRow label="Validator Address">
          <AddressLink address={data.validatorAddress} truncate={false} />
        </DataRow>
        <DataRow label="BTC Oracle Address">
          <AddressLink address={data.btcOracleAddress} truncate={false} />
        </DataRow>
        <DataRow label="BTC Public Key">
          <span className="font-mono text-xs break-all">{data.btcPublicKey}</span>
        </DataRow>
        {data.zkOracleAddress && (
          <DataRow label="ZK Oracle Address">
            <AddressLink address={data.zkOracleAddress} />
          </DataRow>
        )}
      </>
    ),
  },

  '/twilightproject.nyks.forks.MsgSeenBtcChainTip': {
    icon: Eye,
    iconColor: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    title: 'Seen BTC Chain Tip',
    render: (data) => (
      <>
        <DataRow label="BTC Height">
          <BtcBlockLink height={data.btcHeight} className="font-semibold" />
        </DataRow>
        <DataRow label="BTC Hash">
          <BtcHashLink hash={data.btcHash} truncate={false} />
        </DataRow>
        <DataRow label="BTC Oracle Address">
          <AddressLink address={data.btcOracleAddress} truncate={false} />
        </DataRow>
      </>
    ),
  },

  // Volt Module
  '/twilightproject.nyks.volt.MsgSignerApplication': {
    icon: Users,
    iconColor: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/10',
    title: 'Signer Application',
    render: (data) => (
      <>
        <DataRow label="Fragment ID">
          <FragmentLink fragmentId={data.fragmentId} />
        </DataRow>
        <DataRow label="Signer Address">
          <AddressLink address={data.signerAddress} truncate={false} />
        </DataRow>
        <DataRow label="Application Fee">
          {formatSatoshis(data.applicationFee)}
        </DataRow>
        <DataRow label="Fee Bips">
          <span>{data.feeBips} bips</span>
        </DataRow>
        <DataRow label="BTC Public Key">
          <span className="font-mono text-xs break-all">{data.btcPubKey}</span>
        </DataRow>
      </>
    ),
  },

  '/twilightproject.nyks.volt.MsgAcceptSigners': {
    icon: UserCheck,
    iconColor: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    title: 'Accept Signers',
    render: (data) => (
      <>
        <DataRow label="Fragment ID">
          <FragmentLink fragmentId={data.fragmentId} />
        </DataRow>
        <DataRow label="Fragment Owner">
          <AddressLink address={data.judgeAddress} truncate={false} />
        </DataRow>
        <DataRow label="Accepted Signers">
          <div className="flex flex-col gap-1">
            {data.signerApplicationIds && data.signerApplicationIds.length > 0 ? (
              data.signerApplicationIds.map((id: string, i: number) => (
                <span key={i} className="badge badge-success text-xs">
                  Application #{id}
                </span>
              ))
            ) : (
              <span className="text-text-muted">None</span>
            )}
          </div>
        </DataRow>
      </>
    ),
  },

  // zkOS Module
  '/twilightproject.nyks.zkos.MsgTransferTx': {
    icon: Zap,
    iconColor: 'text-primary-light',
    bgColor: 'bg-primary/10',
    title: 'ZK Transfer',
    render: (data) => {
      // Helper to extract value from object or return primitive
      const extractValue = (val: any) => {
        if (val === null || val === undefined) return val;
        if (typeof val === 'object' && 'value' in val) return val.value;
        return val;
      };

      // Extract order info from decoded data summary
      // Note: summary is nested under data.summary in the API response
      const summary = data.zkosDecodedData?.data?.summary || data.zkosDecodedData?.summary;
      const orderOp = extractValue(summary?.order_operation);
      const orderSize = extractValue(summary?.outputs?.[0]?.order_size);

      // Format order size
      const formatOrderSize = (size: number | string | undefined) => {
        if (!size) return null;
        const num = typeof size === 'string' ? parseFloat(size) : size;
        if (isNaN(num)) return null;
        if (num >= 100_000_000) {
          return `${(num / 100_000_000).toFixed(4)} BTC`;
        }
        return `${num.toLocaleString()} sats`;
      };

      // Get order operation label and color
      const getOrderLabel = (op: string) => {
        switch (op) {
          case 'order_open': return { label: 'OPEN ORDER', color: 'badge-success' };
          case 'order_close': return { label: 'CLOSE ORDER', color: 'badge-error' };
          case 'order_modify': return { label: 'MODIFY ORDER', color: 'badge-warning' };
          default: return { label: op?.toUpperCase().replace(/_/g, ' '), color: 'badge-info' };
        }
      };

      const orderLabel = orderOp ? getOrderLabel(orderOp) : null;
      const formattedSize = formatOrderSize(orderSize);

      return (
        <>
          {/* Order Operation Summary - Prominent Display */}
          {orderOp && (
            <div className="mb-4 p-4 rounded-lg bg-background-secondary border border-border/50">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-text-secondary text-xs uppercase block mb-1">Order Type</span>
                  <span className={clsx('badge', orderLabel?.color)}>
                    {orderLabel?.label}
                  </span>
                </div>
                {formattedSize && (
                  <div>
                    <span className="text-text-secondary text-xs uppercase block mb-1">Position Size</span>
                    <span className="text-white font-semibold text-lg">{formattedSize}</span>
                  </div>
                )}
                {summary?.input_type && summary?.output_type && (
                  <div>
                    <span className="text-text-secondary text-xs uppercase block mb-1">Flow</span>
                    <span className="text-white">
                      <span className="text-accent-green">{extractValue(summary.input_type)}</span>
                      <span className="text-text-muted mx-2">→</span>
                      <span className="text-accent-blue">{extractValue(summary.output_type)}</span>
                    </span>
                  </div>
                )}
                {summary?.input_count !== undefined && (
                  <div>
                    <span className="text-text-secondary text-xs uppercase block mb-1">Inputs</span>
                    <span className="text-white font-medium">{extractValue(summary.input_count)}</span>
                  </div>
                )}
                {summary?.output_count !== undefined && (
                  <div>
                    <span className="text-text-secondary text-xs uppercase block mb-1">Outputs</span>
                    <span className="text-white font-medium">{extractValue(summary.output_count)}</span>
                  </div>
                )}
              </div>
              {summary?.order_operation_description && (
                <p className="text-text-secondary text-sm mt-2">{extractValue(summary.order_operation_description)}</p>
              )}

              {/* Input Details */}
              {summary?.inputs && summary.inputs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="text-text-secondary text-xs uppercase block mb-2">Input UTXOs</span>
                  <div className="space-y-1">
                    {summary.inputs.map((input: any, idx: number) => {
                      const txid = extractValue(input.utxo?.txid) || '';
                      const outputIndex = extractValue(input.utxo?.output_index) ?? 0;
                      const inputType = extractValue(input.type) || 'Unknown';
                      const isNullTxid = txid === '0000000000000000000000000000000000000000000000000000000000000000';

                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="badge badge-success text-xs">{inputType}</span>
                          {isNullTxid ? (
                            <span className="text-text-muted font-mono">Genesis State</span>
                          ) : (
                            <span className="font-mono text-primary-light">
                              {txid.substring(0, 8)}...{txid.substring(txid.length - 6)}:{outputIndex}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DataRow label="ZK Transaction ID">
            <span className="font-mono text-sm">{data.zkTxId}</span>
          </DataRow>
          <DataRow label="ZK Oracle Address">
            <AddressLink address={data.zkOracleAddress} truncate={false} />
          </DataRow>
          <DataRow label="Trading Fee">
            {formatSatoshis(data.txFee)}
          </DataRow>
          {data.txByteCode && !data.zkosDecodedData && (
            <DataRow label="Tx ByteCode">
              <span className="font-mono text-xs text-text-muted">
                {data.txByteCode.substring(0, 64)}...
              </span>
            </DataRow>
          )}
          {data.zkosDecodedData && (
            <ZkosTransactionViewer data={data.zkosDecodedData} />
          )}
        </>
      );
    },
  },

  '/twilightproject.nyks.zkos.MsgMintBurnTradingBtc': {
    icon: Coins,
    iconColor: 'text-primary-light',
    bgColor: 'bg-primary/10',
    title: 'Mint/Burn Trading BTC',
    render: (data) => (
      <>
        <DataRow label="Operation">
          <span className={clsx(
            'badge',
            data.mintOrBurn ? 'badge-success' : 'badge-error'
          )}>
            {data.mintOrBurn ? 'MINT' : 'BURN'}
          </span>
        </DataRow>
        <DataRow label="BTC Value">
          <span className={clsx(
            'font-semibold',
            data.mintOrBurn ? 'text-accent-green' : 'text-accent-red'
          )}>
            {data.mintOrBurn ? '+' : '-'}{formatSatoshis(data.btcValue)}
          </span>
        </DataRow>
        <DataRow label="Twilight Address">
          <AddressLink address={data.twilightAddress} truncate={false} />
        </DataRow>
        <DataRow label="QQ Account">
          <span className="font-mono text-sm">{data.qqAccount}</span>
        </DataRow>
      </>
    ),
  },

  // Cosmos SDK standard messages
  '/cosmos.bank.v1beta1.MsgSend': {
    icon: Send,
    iconColor: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    title: 'Send',
    render: (data) => (
      <>
        <DataRow label="From">
          <AddressLink address={data.from_address || data.fromAddress} truncate={false} />
        </DataRow>
        <DataRow label="To">
          <AddressLink address={data.to_address || data.toAddress} truncate={false} />
        </DataRow>
        <DataRow label="Amount">
          {data.amount && Array.isArray(data.amount) ? (
            <div className="flex flex-col gap-1">
              {data.amount.map((coin: any, i: number) => (
                <span key={i} className="text-accent-green font-semibold">
                  {formatCoinAmount(coin.amount, coin.denom)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-text-muted">-</span>
          )}
        </DataRow>
      </>
    ),
  },
};

// Default formatter for unknown message types
function DefaultMessageFormatter({ data }: { data: any }) {
  return (
    <pre className="text-sm text-text-secondary overflow-x-auto bg-background-secondary p-3 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// Main MessageFormatter component
export function MessageFormatter({ message }: { message: any }) {
  const config = messageConfigs[message.type];
  const Icon = config?.icon || FileSignature;
  const iconColor = config?.iconColor || 'text-text-secondary';
  const bgColor = config?.bgColor || 'bg-background-secondary';
  const title = config?.title || message.typeName || message.type.split('.').pop()?.replace('Msg', '') || 'Unknown';

  return (
    <div className="bg-background-tertiary rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className={clsx('flex items-center gap-3 p-4 border-b border-border', bgColor)}>
        <div className={clsx('p-2 rounded-lg bg-background-primary/50')}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {message.module && (
            <span className="text-xs text-text-muted uppercase">{message.module} module</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {config?.render ? (
          config.render(message.data)
        ) : (
          <DefaultMessageFormatter data={message.data} />
        )}
      </div>
    </div>
  );
}

// Export helper components for use elsewhere
export {
  AddressLink,
  BtcAddressLink,
  BtcBlockLink,
  BtcHashLink,
  BtcTxLink,
  DataRow,
  formatCoinAmount,
  formatSatoshis,
  truncateAddress
};
