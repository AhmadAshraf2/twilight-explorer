'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Coins,
  FileCode,
  MessageSquare,
  Copy,
  Check,
  Code,
  TrendingUp,
  TrendingDown,
  FileText,
  Shield,
  Eye,
  ClipboardList,
} from 'lucide-react';
import clsx from 'clsx';

// Helper to extract value from object or return primitive
// Handles API responses where values may be {value, description} objects
function extractValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object' && 'value' in val) {
    return val.value;
  }
  return val;
}

// Helper to safely convert any value to string for display
function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if ('value' in val) return String(val.value);
    return JSON.stringify(val);
  }
  return String(val);
}

// Helper to truncate hex strings
function truncateHex(hex: string, start = 10, end = 8): string {
  const str = safeString(hex);
  if (!str || str.length <= start + end) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

// Helper to convert byte array to hex string
function bytesToHex(bytes: number[] | undefined): string {
  if (!bytes || !Array.isArray(bytes)) return '';
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to get txid from various formats (string or byte array)
function getTxid(utxo: any): string {
  if (!utxo) return '';
  if (typeof utxo.txid === 'string') return utxo.txid;
  if (Array.isArray(utxo.txid)) return bytesToHex(utxo.txid);
  return '';
}

// Helper to get output index from various formats
function getOutputIndex(utxo: any): number {
  if (!utxo) return 0;
  return utxo.output_index ?? utxo.index ?? 0;
}

// Helper to format sats
function formatSats(value: number | string | any): string {
  const extracted = extractValue(value);
  const num = typeof extracted === 'string' ? parseInt(extracted) : extracted;
  if (isNaN(num)) return '0 sats';
  return `${num.toLocaleString()} sats`;
}

// Helper to format order size (large numbers)
function formatOrderSize(value: number | string | any): string {
  const extracted = extractValue(value);
  const num = typeof extracted === 'string' ? parseFloat(extracted) : extracted;
  if (isNaN(num)) return '0';
  // Convert to BTC if large enough (assuming sats)
  if (num >= 100_000_000) {
    return `${(num / 100_000_000).toFixed(2)} BTC`;
  }
  return `${num.toLocaleString()} sats`;
}

// Format price in USD
function formatPrice(value: number | string | any): string {
  const extracted = extractValue(value);
  const num = typeof extracted === 'string' ? parseFloat(extracted) : extracted;
  if (isNaN(num)) return '$0';
  return `$${num.toLocaleString()}`;
}

// Format position size
function formatPositionSize(value: number | string | any): string {
  const extracted = extractValue(value);
  const num = typeof extracted === 'string' ? parseFloat(extracted) : extracted;
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

// Memo Order Details component for displaying order information from Memo data
function MemoOrderDetails({ data }: { data: MemoOrderData }) {
  const { position_size, leverage, entry_price, order_side } = data;

  const isLong = order_side?.toLowerCase() === 'long';
  const isShort = order_side?.toLowerCase() === 'short';

  return (
    <div className="mt-3 space-y-2">
      {/* Order Side Badge */}
      {order_side && (
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">Side:</span>
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase',
              isLong && 'bg-accent-green/20 text-accent-green',
              isShort && 'bg-accent-orange/20 text-accent-orange',
              !isLong && !isShort && 'bg-primary/20 text-primary-light'
            )}
          >
            {isLong && <TrendingUp className="w-3 h-3" />}
            {isShort && <TrendingDown className="w-3 h-3" />}
            {String(order_side)}
          </span>
        </div>
      )}

      {/* Position Size */}
      {position_size !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">Position Size:</span>
          <span className="text-white font-medium">{formatPositionSize(position_size)}</span>
        </div>
      )}

      {/* Entry Price */}
      {entry_price !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">Entry Price:</span>
          <span className="text-white font-medium">{formatPrice(entry_price)}</span>
        </div>
      )}

      {/* Leverage */}
      {leverage !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">Leverage:</span>
          <span className="text-accent-yellow font-medium">
            {typeof leverage === 'string' && leverage.includes('encrypted')
              ? '(encrypted)'
              : `${leverage}x`}
          </span>
        </div>
      )}
    </div>
  );
}

// Get order operation display config
function getOrderOperationConfig(operation: string) {
  switch (operation) {
    case 'order_open':
      return {
        label: 'Open Order',
        color: 'text-accent-green',
        bgColor: 'bg-accent-green/10',
        icon: TrendingUp,
      };
    case 'order_close':
      return {
        label: 'Close Order',
        color: 'text-accent-orange',
        bgColor: 'bg-accent-orange/10',
        icon: TrendingDown,
      };
    case 'order_modify':
      return {
        label: 'Modify Order',
        color: 'text-accent-blue',
        bgColor: 'bg-accent-blue/10',
        icon: FileText,
      };
    default:
      return {
        label: operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: 'text-primary-light',
        bgColor: 'bg-primary/10',
        icon: Zap,
      };
  }
}

// Copy to clipboard with fallback for non-HTTPS
async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
    }
  }

  // Fallback for non-HTTPS contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

// Copy button component
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!text) {
      console.error('No text to copy');
      return;
    }

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(
        'p-1 rounded hover:bg-background-primary/50 transition-colors',
        className
      )}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="w-3 h-3 text-accent-green" />
      ) : (
        <Copy className="w-3 h-3 text-text-muted hover:text-white" />
      )}
    </button>
  );
}

// Copyable text component
function CopyableText({
  text,
  displayText,
  className = '',
}: {
  text: string;
  displayText?: string;
  className?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-1', className)}>
      <span className="break-all">{displayText || text}</span>
      <CopyButton text={text} />
    </span>
  );
}

// Types for zkOS transactions
interface CoinInput {
  input: {
    Coin?: {
      utxo: {
        txid: string;
        index: number;
      };
      out_coin: {
        owner: string;
        encrypt: {
          c: string;
          d: string;
        };
      };
    };
  };
  in_type: string;
}

interface CoinOutput {
  output: {
    Coin?: {
      owner: string;
      encrypt: {
        c: string;
        d: string;
      };
    };
    Memo?: {
      data: string | any[];
    };
    State?: any;
  };
  out_type: string;
}

interface TransferTransaction {
  TransactionTransfer: {
    fee: number;
    version: number;
    maturity: number;
    input_count: number;
    output_count: number;
    inputs: CoinInput[];
    outputs: CoinOutput[];
    proof: any;
    witness: any[];
    witness_count?: number;
  };
}

interface OrderSummaryOutput {
  order_size?: number;
  position?: number;
}

// New Memo data fields from updated decode API
interface MemoOrderData {
  position_size?: number;
  leverage?: string | number;
  entry_price?: number;
  order_side?: 'long' | 'short' | string;
}

interface ZkosSummary {
  input_type?: string;
  output_type?: string;
  order_operation?: string;
  order_type?: string;
  order_operation_description?: string;
  program_opcodes?: string[];
  program_type?: string;
  outputs?: OrderSummaryOutput[];
}

interface ZkosDecodedData {
  tx_type: string;
  success: boolean;
  summary?: ZkosSummary;
  data: {
    tx_type: 'Transfer' | 'Script' | 'Message';
    tx: TransferTransaction | any;
    summary?: ZkosSummary;
  };
}

interface ZkosTransactionViewerProps {
  data: ZkosDecodedData;
}

// Input item component
function InputItem({ input, index }: { input: CoinInput; index: number }) {
  const coin = input.input.Coin;
  if (!coin) {
    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 text-text-secondary">
          <ArrowDownLeft className="w-4 h-4 text-accent-green" />
          <span className="text-sm font-medium">Input #{index + 1}</span>
          <span className="badge badge-info text-xs">{safeString(input.in_type)}</span>
        </div>
      </div>
    );
  }

  const txid = getTxid(coin.utxo);
  const outputIndex = getOutputIndex(coin.utxo);
  const ownerStr = safeString(coin.out_coin?.owner);
  const encryptC = safeString(coin.out_coin?.encrypt?.c);
  const encryptD = safeString(coin.out_coin?.encrypt?.d);

  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <ArrowDownLeft className="w-4 h-4 text-accent-green" />
        <span className="text-white text-sm font-medium">Input #{index + 1}</span>
        <span className="badge badge-success text-xs">{safeString(input.in_type)}</span>
      </div>
      <div className="space-y-1 text-sm pl-6">
        {txid && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">UTXO:</span>
            <span className="font-mono break-all">
              <Link
                href={`/txs/${txid}`}
                className="text-primary-light hover:text-primary hover:underline"
              >
                {truncateHex(txid)}
              </Link>
              <span className="text-text-muted">:{safeString(outputIndex)}</span>
            </span>
          </div>
        )}
        {ownerStr && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Owner:</span>
            <CopyableText
              text={ownerStr}
              displayText={truncateHex(ownerStr, 16, 12)}
              className="font-mono text-primary-light"
            />
          </div>
        )}
        {encryptC && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Encrypt C:</span>
            <CopyableText
              text={encryptC}
              displayText={encryptC}
              className="font-mono text-text-muted text-xs"
            />
          </div>
        )}
        {encryptD && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Encrypt D:</span>
            <CopyableText
              text={encryptD}
              displayText={encryptD}
              className="font-mono text-text-muted text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Output item component
function OutputItem({ output, index }: { output: CoinOutput; index: number }) {
  const coin = output.output.Coin;
  const memo = output.output.Memo;
  const state = output.output.State;

  if (memo) {
    const memoData = extractValue(memo.data);

    // Check if memoData is an array with order information (from new API)
    const hasOrderData = Array.isArray(memoData) && memoData.length > 0 &&
      (memoData[0]?.position_size !== undefined ||
       memoData[0]?.order_side !== undefined ||
       memoData[0]?.entry_price !== undefined);

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent-blue" />
          <span className="text-white text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-info text-xs">Memo</span>
          {hasOrderData && memoData[0]?.order_side && (
            <span
              className={clsx(
                'badge text-xs',
                memoData[0].order_side.toLowerCase() === 'long' && 'badge-success',
                memoData[0].order_side.toLowerCase() === 'short' && 'badge-warning'
              )}
            >
              {String(memoData[0].order_side).toUpperCase()}
            </span>
          )}
        </div>
        <div className="space-y-1 text-sm pl-6">
          {hasOrderData ? (
            // Display order details from new API format
            <MemoOrderDetails data={memoData[0] as MemoOrderData} />
          ) : (
            // Fallback to old display format
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[60px]">Data:</span>
              <span className="font-mono text-text-muted break-all">
                {typeof memoData === 'string'
                  ? truncateHex(memoData, 20, 16)
                  : Array.isArray(memoData)
                    ? `${memoData.length} items`
                    : 'N/A'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state) {
    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-accent-yellow" />
          <span className="text-white text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-warning text-xs">State</span>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 text-text-secondary">
          <ArrowUpRight className="w-4 h-4 text-accent-orange" />
          <span className="text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-warning text-xs">{safeString(output.out_type)}</span>
        </div>
      </div>
    );
  }

  const ownerStr = safeString(coin.owner);
  const encryptC = safeString(coin.encrypt?.c);
  const encryptD = safeString(coin.encrypt?.d);

  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpRight className="w-4 h-4 text-accent-orange" />
        <span className="text-white text-sm font-medium">Output #{index + 1}</span>
        <span className="badge badge-success text-xs">{safeString(output.out_type)}</span>
      </div>
      <div className="space-y-1 text-sm pl-6">
        {ownerStr && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Owner:</span>
            <CopyableText
              text={ownerStr}
              displayText={truncateHex(ownerStr, 16, 12)}
              className="font-mono text-primary-light"
            />
          </div>
        )}
        {encryptC && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Encrypt C:</span>
            <CopyableText
              text={encryptC}
              displayText={encryptC}
              className="font-mono text-text-muted text-xs"
            />
          </div>
        )}
        {encryptD && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[60px]">Encrypt D:</span>
            <CopyableText
              text={encryptD}
              displayText={encryptD}
              className="font-mono text-text-muted text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Script output item component
function ScriptOutputItem({ output, index }: { output: any; index: number }) {
  const memo = output.output?.Memo;
  const state = output.output?.State;

  if (memo) {
    const ownerStr = safeString(memo.owner);
    const scriptAddrStr = safeString(memo.script_address);
    const commitment = getCommitment(memo.commitment);
    const memoData = memo.data;

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent-blue" />
          <span className="text-white text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-info text-xs">Memo</span>
        </div>
        <div className="space-y-1 text-sm pl-6">
          {ownerStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Owner:</span>
              <CopyableText
                text={ownerStr}
                displayText={ownerStr}
                className="font-mono text-primary-light text-xs break-all"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={scriptAddrStr}
                className="font-mono text-accent-yellow text-xs break-all"
              />
            </div>
          )}
          {commitment && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Commitment:</span>
              <CopyableText
                text={commitment}
                displayText={commitment}
                className="font-mono text-text-muted text-xs break-all"
              />
            </div>
          )}
          {memo.timebounds !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Timebounds:</span>
              <span className="text-white">{safeString(memo.timebounds)}</span>
            </div>
          )}
          {memoData && Array.isArray(memoData) && memoData.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Data:</span>
              <div className="flex-1 space-y-1">
                {memoData.map((item: any, i: number) => {
                  if (typeof item === 'string') {
                    return <span key={i} className="text-text-muted text-xs block">{item}</span>;
                  }
                  if (item?.commitment) {
                    return <span key={i} className="text-text-muted text-xs block">{safeString(item.commitment)}</span>;
                  }
                  return <span key={i} className="text-text-muted text-xs block">{JSON.stringify(item)}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state) {
    const ownerStr = safeString(state.owner);
    const scriptAddrStr = safeString(state.script_address);
    const commitment = getCommitment(state.commitment);
    const stateVars = state.state_variables;

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent-yellow" />
          <span className="text-white text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-warning text-xs">State</span>
        </div>
        <div className="space-y-1 text-sm pl-6">
          {ownerStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Owner:</span>
              <CopyableText
                text={ownerStr}
                displayText={ownerStr}
                className="font-mono text-primary-light text-xs break-all"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={scriptAddrStr}
                className="font-mono text-accent-yellow text-xs break-all"
              />
            </div>
          )}
          {commitment && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Commitment:</span>
              <CopyableText
                text={commitment}
                displayText={commitment}
                className="font-mono text-text-muted text-xs break-all"
              />
            </div>
          )}
          {state.nonce !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Nonce:</span>
              <span className="text-white">{safeString(state.nonce)}</span>
            </div>
          )}
          {state.timebounds !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Timebounds:</span>
              <span className="text-white">{safeString(state.timebounds)}</span>
            </div>
          )}
          {stateVars && Array.isArray(stateVars) && stateVars.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">State Vars:</span>
              <div className="flex-1 space-y-1">
                {stateVars.map((sv: any, i: number) => {
                  const svCommitment = getCommitment(sv?.Commitment);
                  if (svCommitment) {
                    return (
                      <CopyableText
                        key={i}
                        text={svCommitment}
                        displayText={svCommitment}
                        className="font-mono text-text-muted text-xs block break-all"
                      />
                    );
                  }
                  return <span key={i} className="text-text-muted text-xs">{JSON.stringify(sv)}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="w-4 h-4 text-text-secondary" />
        <span className="text-white text-sm font-medium">Output #{index + 1}</span>
        <span className="badge text-xs">{safeString(output.out_type)}</span>
      </div>
    </div>
  );
}

// Helper to get commitment value from various formats
function getCommitment(commitment: any): string | null {
  if (!commitment) return null;
  if (typeof commitment === 'string') return commitment;
  if (commitment.Closed) return commitment.Closed;
  if (commitment.Open) return commitment.Open;
  return null;
}

// Script input item component
function ScriptInputItem({ input, index }: { input: any; index: number }) {
  const coin = input.input?.Coin;
  const state = input.input?.State;
  const inType = safeString(input.in_type) || 'Unknown';

  if (coin) {
    const txid = getTxid(coin.utxo);
    const outputIndex = getOutputIndex(coin.utxo);
    const ownerStr = safeString(coin.out_coin?.owner);
    const encryptC = safeString(coin.out_coin?.encrypt?.c);
    const encryptD = safeString(coin.out_coin?.encrypt?.d);
    const witnessIdx = coin.witness;
    const isNullTxid = txid === '0000000000000000000000000000000000000000000000000000000000000000';

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownLeft className="w-4 h-4 text-accent-green" />
          <span className="text-white text-sm font-medium">Input #{index + 1}</span>
          <span className="badge badge-success text-xs">{inType}</span>
          {witnessIdx !== undefined && (
            <span className="text-text-muted text-xs">witness: {witnessIdx}</span>
          )}
        </div>
        <div className="space-y-1 text-sm pl-6">
          {txid && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">UTXO:</span>
              {isNullTxid ? (
                <span className="text-text-muted font-mono">Genesis</span>
              ) : (
                <span className="font-mono">
                  <Link
                    href={`/txs/${txid}`}
                    className="text-primary-light hover:text-primary hover:underline"
                  >
                    {truncateHex(txid)}
                  </Link>
                  <span className="text-text-muted">:{safeString(outputIndex)}</span>
                </span>
              )}
            </div>
          )}
          {ownerStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Owner:</span>
              <CopyableText
                text={ownerStr}
                displayText={ownerStr}
                className="font-mono text-primary-light text-xs break-all"
              />
            </div>
          )}
          {encryptC && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Encrypt C:</span>
              <CopyableText
                text={encryptC}
                displayText={encryptC}
                className="font-mono text-text-muted text-xs break-all"
              />
            </div>
          )}
          {encryptD && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Encrypt D:</span>
              <CopyableText
                text={encryptD}
                displayText={encryptD}
                className="font-mono text-text-muted text-xs break-all"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state) {
    const txid = getTxid(state.utxo);
    const outputIndex = getOutputIndex(state.utxo);
    const ownerStr = safeString(state.out_state?.owner);
    const scriptAddrStr = safeString(state.out_state?.script_address);
    const commitment = getCommitment(state.out_state?.commitment);
    const nonce = state.out_state?.nonce;
    const timebounds = state.out_state?.timebounds;
    const stateVars = state.out_state?.state_variables;
    const witnessIdx = state.witness;
    const isNullTxid = txid === '0000000000000000000000000000000000000000000000000000000000000000';

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownLeft className="w-4 h-4 text-accent-yellow" />
          <span className="text-white text-sm font-medium">Input #{index + 1}</span>
          <span className="badge badge-warning text-xs">{inType}</span>
          {witnessIdx !== undefined && (
            <span className="text-text-muted text-xs">witness: {witnessIdx}</span>
          )}
        </div>
        <div className="space-y-1 text-sm pl-6">
          {txid && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">UTXO:</span>
              {isNullTxid ? (
                <span className="text-text-muted font-mono">Genesis State</span>
              ) : (
                <span className="font-mono">
                  <Link
                    href={`/txs/${txid}`}
                    className="text-primary-light hover:text-primary hover:underline"
                  >
                    {truncateHex(txid)}
                  </Link>
                  <span className="text-text-muted">:{safeString(outputIndex)}</span>
                </span>
              )}
            </div>
          )}
          {ownerStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Owner:</span>
              <CopyableText
                text={ownerStr}
                displayText={ownerStr}
                className="font-mono text-primary-light text-xs break-all"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={scriptAddrStr}
                className="font-mono text-accent-yellow text-xs break-all"
              />
            </div>
          )}
          {commitment && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Commitment:</span>
              <CopyableText
                text={commitment}
                displayText={commitment}
                className="font-mono text-text-muted text-xs break-all"
              />
            </div>
          )}
          {nonce !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Nonce:</span>
              <span className="text-white">{safeString(nonce)}</span>
            </div>
          )}
          {timebounds !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Timebounds:</span>
              <span className="text-white">{safeString(timebounds)}</span>
            </div>
          )}
          {stateVars && Array.isArray(stateVars) && stateVars.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">State Vars:</span>
              <div className="flex-1 space-y-1">
                {stateVars.map((sv: any, i: number) => {
                  const svCommitment = getCommitment(sv?.Commitment);
                  if (svCommitment) {
                    return (
                      <CopyableText
                        key={i}
                        text={svCommitment}
                        displayText={svCommitment}
                        className="font-mono text-text-muted text-xs block break-all"
                      />
                    );
                  }
                  return <span key={i} className="text-text-muted text-xs">{JSON.stringify(sv)}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2">
        <ArrowDownLeft className="w-4 h-4 text-text-secondary" />
        <span className="text-white text-sm font-medium">Input #{index + 1}</span>
        <span className="badge text-xs">{inType}</span>
      </div>
    </div>
  );
}

// Opcode display component (API returns human-readable opcode strings)
function OpcodeItem({ opcode }: { opcode: string }) {
  return (
    <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-background-primary/50 border border-border/30 text-primary-light">
      {opcode}
    </span>
  );
}

// Helper to check if value is a byte array (array of numbers 0-255)
function isByteArray(arr: any): boolean {
  return Array.isArray(arr) && arr.length > 0 && arr.every((x: any) => typeof x === 'number' && x >= 0 && x <= 255);
}

// Helper to flatten nested arrays and extract strings/byte arrays
function extractProofStrings(arr: any[]): string[] {
  const results: string[] = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      results.push(item);
    } else if (isByteArray(item)) {
      results.push(bytesToHex(item));
    } else if (Array.isArray(item)) {
      // Recursively handle nested arrays
      results.push(...extractProofStrings(item));
    }
  }
  return results;
}

// Helper to format proof data - returns array of strings for display
function formatProofData(data: any): string[] {
  const lines: string[] = [];

  if (typeof data === 'string') {
    lines.push(data);
    return lines;
  }

  if (Array.isArray(data)) {
    const extracted = extractProofStrings(data);
    if (extracted.length > 0) return extracted;
  }

  if (typeof data === 'object' && data !== null) {
    // Handle { Proof: { Dlog: [...] } } wrapper format
    if (data.Proof?.Dlog && Array.isArray(data.Proof.Dlog)) {
      const extracted = extractProofStrings(data.Proof.Dlog);
      if (extracted.length > 0) return extracted;
    }
    // Handle { Proof: { Dleq: [...] } } wrapper format
    if (data.Proof?.Dleq && Array.isArray(data.Proof.Dleq)) {
      const extracted = extractProofStrings(data.Proof.Dleq);
      if (extracted.length > 0) return extracted;
    }
    // Handle Dleq format: { Dleq: [string, string, ...] }
    if (data.Dleq && Array.isArray(data.Dleq)) {
      const extracted = extractProofStrings(data.Dleq);
      if (extracted.length > 0) return extracted;
    }
    // Handle Dlog format: { Dlog: [string, string, ...] }
    if (data.Dlog && Array.isArray(data.Dlog)) {
      const extracted = extractProofStrings(data.Dlog);
      if (extracted.length > 0) return extracted;
    }
  }

  lines.push(String(data));
  return lines;
}

// Witness item component
function WitnessItem({ witness, index }: { witness: any; index: number }) {
  // Handle different witness formats:
  // - { ValueWitness: { sign, value_proof } } (Script transactions)
  // - { State: { sign, zero_proof } } (Script transactions)
  // - { valueWitness: { sign }, value_proof } (Transfer transactions)
  // - { Proof: { Dlog: [...] } } (Transfer transactions - simple proof)
  const valueWitness = witness?.ValueWitness || witness?.valueWitness || witness?.value_witness;
  const stateWitness = witness?.State;
  const proofWitness = witness?.Proof;

  // Get sign from either format
  const sign = valueWitness?.sign || stateWitness?.sign;

  // Get proof from either format
  const valueProof = valueWitness?.value_proof || witness?.value_proof || witness?.valueProof;
  const zeroProof = stateWitness?.zero_proof;

  // Determine witness type for display
  const witnessType = witness?.ValueWitness ? 'Value' : witness?.State ? 'State' : witness?.Proof ? 'Proof' : '';

  // Check if this is a simple Proof witness (has Dlog or Dleq directly)
  const isProofWitness = proofWitness && (proofWitness.Dlog || proofWitness.Dleq);

  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-accent-blue" />
        <span className="text-white text-sm font-medium">Witness #{index + 1}</span>
        {witnessType && (
          <span className={clsx(
            'badge text-xs',
            witnessType === 'Value' ? 'badge-success' : witnessType === 'Proof' ? 'badge-info' : 'badge-warning'
          )}>
            {witnessType}
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm pl-6">
        {/* Sign */}
        {sign !== undefined && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[100px]">Sign:</span>
            <CopyableText
              text={String(sign)}
              displayText={String(sign)}
              className="font-mono text-text-muted text-xs break-all"
            />
          </div>
        )}

        {/* Value Proof */}
        {valueProof && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[100px]">Value Proof:</span>
            <div className="flex-1 space-y-1">
              {formatProofData(valueProof).map((line, i) => (
                <CopyableText
                  key={i}
                  text={line}
                  displayText={line}
                  className="font-mono text-text-muted text-xs block break-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* Zero Proof (for State witness) */}
        {zeroProof && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[100px]">Zero Proof:</span>
            <div className="flex-1 space-y-1">
              {formatProofData(zeroProof).map((line, i) => (
                <CopyableText
                  key={i}
                  text={line}
                  displayText={line}
                  className="font-mono text-text-muted text-xs block break-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* Proof witness (Dlog/Dleq format) */}
        {isProofWitness && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[100px]">
              {proofWitness.Dlog ? 'Dlog:' : 'Dleq:'}
            </span>
            <div className="flex-1 space-y-1">
              {formatProofData(witness).map((line, i) => (
                <CopyableText
                  key={i}
                  text={line}
                  displayText={line}
                  className="font-mono text-text-muted text-xs block break-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* Show full witness if no specific fields found */}
        {!sign && !valueProof && !zeroProof && !isProofWitness && (
          <div className="flex items-start gap-2">
            <span className="text-text-secondary min-w-[100px]">Data:</span>
            <span className="font-mono text-text-muted break-all text-xs">
              {typeof witness === 'string' ? truncateHex(witness, 32, 16) : JSON.stringify(witness, null, 2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Script transaction viewer
function ScriptViewer({ tx, summary }: { tx: any; summary?: ZkosSummary }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [showProgram, setShowProgram] = useState(true);
  const [showProof, setShowProof] = useState(false);
  const script = tx.TransactionScript;

  // Get input/output types from summary or from tx data
  const inputType = safeString(summary?.input_type || script?.inputs?.[0]?.in_type) || 'Unknown';
  const outputType = safeString(summary?.output_type || script?.outputs?.[0]?.out_type) || 'Unknown';

  if (!script) {
    return <div className="text-text-muted">Invalid script transaction data</div>;
  }

  // Get program/opcodes - prefer human-readable opcodes from summary (decode API)
  const program = summary?.program_opcodes || script.program || script.opcodes || script.code || [];
  const hasProgram = Array.isArray(program) && program.length > 0;
  const hasProof = script.proof || script.call_proof;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Version: </span>
          <span className="text-white font-medium">{safeString(script.version)}</span>
        </div>
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Fee: </span>
          <span className="text-accent-yellow font-medium">{formatSats(script.fee)}</span>
        </div>
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Maturity: </span>
          <span className="text-white font-medium">{safeString(script.maturity)}</span>
        </div>
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Type: </span>
          <span className="text-accent-green font-medium">{inputType}</span>
          <span className="text-text-muted mx-1">→</span>
          <span className="text-accent-blue font-medium">{outputType}</span>
        </div>
        {hasProgram && (
          <div className="bg-background-secondary rounded-lg px-3 py-2">
            <span className="text-text-secondary">Opcodes: </span>
            <span className="text-white font-medium">{program.length}</span>
          </div>
        )}
      </div>

      {/* Order Details Section - Shows all summary fields */}
      {summary && <SummaryDetailsSection summary={summary} />}

      {/* Program/Opcodes */}
      {hasProgram && (
        <div>
          <button
            onClick={() => setShowProgram(!showProgram)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary uppercase mb-2 hover:text-white transition-colors"
          >
            {showProgram ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Code className="w-4 h-4" />
            Program ({program.length} opcodes)
          </button>
          {showProgram && (
            <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
              <div className="flex flex-wrap gap-1.5">
                {program.map((opcode: string, idx: number) => (
                  <OpcodeItem key={idx} opcode={opcode} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inputs */}
      {script.inputs && script.inputs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Inputs ({safeString(script.input_count) || script.inputs.length})
          </h4>
          <div className="space-y-2">
            {script.inputs.map((input: any, idx: number) => (
              <ScriptInputItem key={idx} input={input} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Outputs */}
      {script.outputs && script.outputs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Outputs ({safeString(script.output_count) || script.outputs.length})
          </h4>
          <div className="space-y-2">
            {script.outputs.map((output: any, idx: number) => (
              <ScriptOutputItem key={idx} output={output} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Witness */}
      {script.witness && Array.isArray(script.witness) && script.witness.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Witness ({script.witness_count || script.witness.length})
          </h4>
          <div className="space-y-2">
            {script.witness.map((wit: any, idx: number) => (
              <WitnessItem key={idx} witness={wit} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Proof Section (collapsible) */}
      {hasProof && (
        <div>
          <button
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
          >
            {showProof ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Shield className="w-4 h-4" />
            Proof Data
          </button>
          {showProof && (
            <div className="mt-2 bg-background-secondary rounded-lg p-3 border border-border/50 space-y-4">
              {/* Call Proof */}
              {script.call_proof && (
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Call Proof</div>
                  <div className="space-y-2 text-sm">
                    {script.call_proof.network && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">Network:</span>
                        <span className="text-white">{script.call_proof.network}</span>
                      </div>
                    )}
                    {script.call_proof.path && (
                      <div>
                        <div className="text-text-muted mb-1">Path (Position: {script.call_proof.path.position}):</div>
                        <div className="space-y-1 pl-2">
                          {script.call_proof.path.neighbors?.map((neighbor: string, idx: number) => (
                            <CopyableText
                              key={idx}
                              text={neighbor}
                              displayText={neighbor}
                              className="font-mono text-text-secondary text-xs block break-all"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main Proof (hex string) */}
              {script.proof && typeof script.proof === 'string' && (
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Proof</div>
                  <CopyableText
                    text={script.proof}
                    displayText={script.proof}
                    className="font-mono text-text-secondary text-xs block break-all"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON (collapsible) */}
      <div>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
        >
          {showRawJson ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Raw Decoded JSON
        </button>
        {showRawJson && (
          <div className="mt-2 bg-background-secondary rounded-lg p-3 overflow-hidden">
            <div className="flex justify-end mb-2">
              <CopyButton text={JSON.stringify(tx, null, 2)} />
            </div>
            <pre className="text-xs text-text-secondary overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(tx, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Proof account display component
function ProofAccountsSection({ title, accounts }: { title: string; accounts: any[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors font-medium"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title} ({accounts.length})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 pl-4">
          {accounts.map((account: any, idx: number) => (
            <div key={idx} className="bg-background-primary/30 rounded p-2 text-xs space-y-1">
              <div className="text-text-muted font-medium">Account #{idx + 1}</div>
              {account.pk && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-text-muted min-w-[40px]">gr:</span>
                    <CopyableText text={account.pk.gr} displayText={account.pk.gr} className="font-mono text-text-secondary break-all" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-text-muted min-w-[40px]">grsk:</span>
                    <CopyableText text={account.pk.grsk} displayText={account.pk.grsk} className="font-mono text-text-secondary break-all" />
                  </div>
                </div>
              )}
              {account.comm && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-text-muted min-w-[40px]">c:</span>
                    <CopyableText text={account.comm.c} displayText={account.comm.c} className="font-mono text-text-secondary break-all" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-text-muted min-w-[40px]">d:</span>
                    <CopyableText text={account.comm.d} displayText={account.comm.d} className="font-mono text-text-secondary break-all" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Proof DLEQ display component
function ProofDleqSection({ title, data }: { title: string; data: any }) {
  const [expanded, setExpanded] = useState(false);
  const proofStrings = formatProofData(data);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors font-medium"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title} ({proofStrings.length} elements)
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 pl-4">
          {proofStrings.map((line, idx) => (
            <CopyableText
              key={idx}
              text={line}
              displayText={line}
              className="font-mono text-text-secondary text-xs block break-all"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Summary/Order Details section component
function SummaryDetailsSection({ summary }: { summary: any }) {
  if (!summary || Object.keys(summary).length === 0) {
    return null;
  }

  // Filter out empty/null values and redundant fields
  const entries = Object.entries(summary).filter(([key, value]) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    // Skip program_opcodes as they're shown in a separate section
    if (key === 'program_opcodes') return false;
    return true;
  });

  if (entries.length === 0) {
    return null;
  }

  // Format field name for display (snake_case to Title Case)
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format value for display
  const formatValue = (key: string, value: any): React.ReactNode => {
    if (typeof value === 'string') {
      // Check if it's a long hex string
      if (value.length > 50 && /^[a-f0-9]+$/i.test(value)) {
        return (
          <CopyableText
            text={value}
            displayText={value}
            className="font-mono text-text-secondary text-xs break-all"
          />
        );
      }
      return <span className="text-white">{value}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-white font-medium">{value.toLocaleString()}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-accent-green' : 'text-accent-red'}>{value ? 'Yes' : 'No'}</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      // Check if it's an array of strings (like program_opcodes)
      if (value.every(v => typeof v === 'string')) {
        if (key === 'program_opcodes') {
          return (
            <div className="flex flex-wrap gap-1 mt-1">
              {value.map((opcode, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-xs font-mono bg-background-primary/50 border border-border/30 text-primary-light">
                  {opcode}
                </span>
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-1 mt-1">
            {value.map((item, idx) => (
              <CopyableText
                key={idx}
                text={item}
                displayText={item}
                className="font-mono text-text-secondary text-xs block break-all"
              />
            ))}
          </div>
        );
      }
      // Array of objects (like outputs)
      return (
        <div className="mt-1 space-y-2">
          {value.map((item, idx) => (
            <div key={idx} className="bg-background-primary/30 rounded p-2 text-xs">
              {Object.entries(item).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <span className="text-text-muted min-w-[80px]">{formatFieldName(k)}:</span>
                  <span className="text-white">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="mt-1 bg-background-primary/30 rounded p-2 text-xs">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-text-muted min-w-[80px]">{formatFieldName(k)}:</span>
              <span className="text-white">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-white">{String(value)}</span>;
  };

  return (
    <div className="bg-background-secondary rounded-lg p-4 border border-border/50">
      <h4 className="text-sm font-medium text-text-secondary uppercase mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4" />
        Order Details
      </h4>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="text-text-muted min-w-[140px]">{formatFieldName(key)}:</span>
              <div className="flex-1">{formatValue(key, value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Transfer transaction viewer
function TransferViewer({ tx, summary }: { tx: TransferTransaction; summary?: ZkosSummary }) {
  const [showProof, setShowProof] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const transfer = tx.TransactionTransfer;

  if (!transfer) {
    return <div className="text-text-muted">Invalid transfer transaction data</div>;
  }

  // Witness can be at tx.witness or transfer.witness depending on the structure
  const witnessData = (tx as any).witness || transfer.witness;
  const witnessCount = transfer.witness_count || (Array.isArray(witnessData) ? witnessData.length : 0);
  const hasWitness = witnessCount > 0 || (witnessData && Array.isArray(witnessData) && witnessData.length > 0);
  const hasProof = transfer.proof && Object.keys(transfer.proof).length > 0;

  return (
    <div className="space-y-4">
      {/* Basic Info Summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Version: </span>
          <span className="text-white font-medium">{safeString(transfer.version)}</span>
        </div>
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Fee: </span>
          <span className="text-accent-yellow font-medium">{formatSats(transfer.fee)}</span>
        </div>
        <div className="bg-background-secondary rounded-lg px-3 py-2">
          <span className="text-text-secondary">Maturity: </span>
          <span className="text-white font-medium">{safeString(transfer.maturity)}</span>
        </div>
      </div>

      {/* Order Details Section - Shows all summary fields */}
      {summary && <SummaryDetailsSection summary={summary} />}

      {/* Inputs */}
      {transfer.inputs && transfer.inputs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Inputs ({safeString(transfer.input_count) || transfer.inputs.length})
          </h4>
          <div className="space-y-2">
            {transfer.inputs.map((input, idx) => (
              <InputItem key={idx} input={input} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Outputs */}
      {transfer.outputs && transfer.outputs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Outputs ({safeString(transfer.output_count) || transfer.outputs.length})
          </h4>
          <div className="space-y-2">
            {transfer.outputs.map((output, idx) => (
              <OutputItem key={idx} output={output} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Witness */}
      {hasWitness && Array.isArray(witnessData) && witnessData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Witness ({witnessCount})
          </h4>
          <div className="space-y-2">
            {witnessData.map((wit: any, idx: number) => (
              <WitnessItem key={idx} witness={wit} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Proof Section (collapsible) */}
      {hasProof && (
        <div>
          <button
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
          >
            {showProof ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Shield className="w-4 h-4" />
            Proof Data ({transfer.proof?.delta_dleq ? 'DarkTxProof' : 'ShuffleTxProof'})
          </button>
          {showProof && (
            <div className="mt-2 bg-background-secondary rounded-lg p-3 border border-border/50 space-y-4">
              {/* Receivers Count */}
              {transfer.proof?.receivers_count !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-xs">Receivers:</span>
                  <span className="text-white text-sm font-medium">{transfer.proof.receivers_count}</span>
                </div>
              )}

              {/* Delta Accounts */}
              {transfer.proof?.delta_accounts && transfer.proof.delta_accounts.length > 0 && (
                <ProofAccountsSection title="Delta Accounts" accounts={transfer.proof.delta_accounts} />
              )}

              {/* Delta DLEQ */}
              {transfer.proof?.delta_dleq && (
                <ProofDleqSection title="Delta DLEQ" data={transfer.proof.delta_dleq} />
              )}

              {/* Epsilon Accounts */}
              {transfer.proof?.epsilon_accounts && transfer.proof.epsilon_accounts.length > 0 && (
                <ProofAccountsSection title="Epsilon Accounts" accounts={transfer.proof.epsilon_accounts} />
              )}

              {/* Sender Account DLEQ */}
              {transfer.proof?.sender_account_dleq && (
                <ProofDleqSection title="Sender Account DLEQ" data={transfer.proof.sender_account_dleq} />
              )}

              {/* Updated Delta Accounts */}
              {transfer.proof?.updated_delta_accounts && transfer.proof.updated_delta_accounts.length > 0 && (
                <ProofAccountsSection title="Updated Delta Accounts" accounts={transfer.proof.updated_delta_accounts} />
              )}

              {/* Updated Sender Epsilon Accounts */}
              {transfer.proof?.updated_sender_epsilon_accounts && transfer.proof.updated_sender_epsilon_accounts.length > 0 && (
                <ProofAccountsSection title="Updated Sender Epsilon Accounts" accounts={transfer.proof.updated_sender_epsilon_accounts} />
              )}

              {/* Range Proof */}
              {transfer.proof?.range_proof && transfer.proof.range_proof.length > 0 && (
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Range Proof</div>
                  <div className="space-y-1">
                    {transfer.proof.range_proof.map((proof: string, idx: number) => (
                      <CopyableText
                        key={idx}
                        text={proof}
                        displayText={proof}
                        className="font-mono text-text-secondary text-xs block break-all"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Aggregated Equality Proof */}
              {transfer.proof?.aggregated_eq_proof && (
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Aggregated Equality Proof</div>
                  <div className="bg-background-primary/30 rounded p-2 overflow-x-auto">
                    <pre className="text-xs text-text-secondary">
                      {JSON.stringify(transfer.proof.aggregated_eq_proof, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Updated Output Proof */}
              {transfer.proof?.updated_output_proof && (
                <div>
                  <div className="text-xs text-text-muted mb-2 font-medium">Updated Output Proof</div>
                  <div className="bg-background-primary/30 rounded p-2 overflow-x-auto">
                    <pre className="text-xs text-text-secondary">
                      {JSON.stringify(transfer.proof.updated_output_proof, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON (collapsible) */}
      <div>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
        >
          {showRawJson ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Raw Decoded JSON
        </button>
        {showRawJson && (
          <div className="mt-2 bg-background-secondary rounded-lg p-3 overflow-hidden">
            <div className="flex justify-end mb-2">
              <CopyButton text={JSON.stringify(tx, null, 2)} />
            </div>
            <pre className="text-xs text-text-secondary overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(tx, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Order Summary component for displaying order operations
function OrderSummary({ summary }: { summary: ZkosSummary }) {
  const [showOpcodes, setShowOpcodes] = useState(false);
  const operation = safeString(summary.order_operation);
  if (!operation) return null;

  const config = getOrderOperationConfig(operation);
  const Icon = config.icon;
  const orderSize = summary.outputs?.[0]?.order_size;
  const orderType = safeString(summary.order_type);
  const programType = safeString(summary.program_type);
  const programOpcodes = summary.program_opcodes || [];

  return (
    <div className={clsx('rounded-lg p-4 mb-4 border border-border/50', config.bgColor)}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background-primary/50">
          <Icon className={clsx('w-5 h-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={clsx('font-semibold', config.color)}>{config.label}</span>
            {orderType && (
              <span className="badge badge-info text-xs">{orderType}</span>
            )}
            {programType && (
              <span className="badge text-xs">{programType}</span>
            )}
            <span className="text-text-muted text-xs">
              {safeString(summary.input_type)} → {safeString(summary.output_type)}
            </span>
          </div>
          {summary.order_operation_description && (
            <p className="text-text-secondary text-sm mb-2">
              {safeString(summary.order_operation_description)}
            </p>
          )}
          {orderSize && (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-text-muted">Position Size: </span>
                <span className="text-white font-medium">{formatOrderSize(orderSize)}</span>
              </div>
            </div>
          )}

          {/* Program Opcodes */}
          {programOpcodes.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowOpcodes(!showOpcodes)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
              >
                {showOpcodes ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Code className="w-4 h-4" />
                <span>Program Opcodes ({programOpcodes.length})</span>
              </button>
              {showOpcodes && (
                <div className="mt-2 bg-background-primary/30 rounded-lg p-3 border border-border/30">
                  <div className="flex flex-wrap gap-1.5">
                    {programOpcodes.map((opcode: string, idx: number) => (
                      <OpcodeItem key={idx} opcode={opcode} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export function ZkosTransactionViewer({ data }: ZkosTransactionViewerProps) {
  if (!data || !data.success || !data.data) {
    return (
      <div className="bg-background-tertiary rounded-lg p-4 mt-4">
        <p className="text-text-muted text-sm">Failed to decode zkOS transaction</p>
      </div>
    );
  }

  const txType = data.data.tx_type;
  const tx = data.data.tx;

  // Determine icon and styling based on transaction type
  const getTypeConfig = () => {
    switch (txType) {
      case 'Transfer':
        return {
          icon: Zap,
          title: 'zkOS Transfer Transaction',
          bgColor: 'bg-primary/10',
          iconColor: 'text-primary-light',
        };
      case 'Script':
        return {
          icon: FileCode,
          title: 'zkOS Script Transaction',
          bgColor: 'bg-accent-blue/10',
          iconColor: 'text-accent-blue',
        };
      case 'Message':
        return {
          icon: MessageSquare,
          title: 'zkOS Message Transaction',
          bgColor: 'bg-accent-orange/10',
          iconColor: 'text-accent-orange',
        };
      default:
        return {
          icon: Zap,
          title: `zkOS ${txType} Transaction`,
          bgColor: 'bg-primary/10',
          iconColor: 'text-primary-light',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="bg-background-tertiary rounded-lg border border-border overflow-hidden mt-4">
      {/* Header */}
      <div className={clsx('flex items-center gap-3 p-4 border-b border-border', config.bgColor)}>
        <div className="p-2 rounded-lg bg-background-primary/50">
          <Icon className={clsx('w-5 h-5', config.iconColor)} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{config.title}</h3>
          <span className="text-xs text-text-muted uppercase">Decoded Internal Transaction</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Order Summary (if available) - Note: summary is nested under data.summary in the API response */}
        {(data.data?.summary?.order_operation || data.summary?.order_operation) && (
          <OrderSummary summary={data.data?.summary || data.summary!} />
        )}

        {txType === 'Transfer' && <TransferViewer tx={tx} summary={data.data?.summary || data.summary} />}
        {txType === 'Script' && <ScriptViewer tx={tx} summary={data.data?.summary || data.summary} />}
        {txType === 'Message' && (
          <div className="space-y-4">
            <div className="bg-background-secondary rounded-lg p-3">
              <span className="text-text-secondary text-sm">Message transaction (burn operation)</span>
            </div>
            <pre className="text-sm text-text-secondary overflow-x-auto bg-background-secondary p-3 rounded max-h-40">
              {JSON.stringify(tx, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
