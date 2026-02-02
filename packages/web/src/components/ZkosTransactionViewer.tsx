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

// Copy button component
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
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
                displayText={truncateHex(ownerStr, 16, 12)}
                className="font-mono text-primary-light"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={truncateHex(scriptAddrStr, 12, 8)}
                className="font-mono text-accent-yellow"
              />
            </div>
          )}
          {memo.timebounds !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Timebounds:</span>
              <span className="text-white">{safeString(memo.timebounds)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state) {
    const ownerStr = safeString(state.owner);
    const scriptAddrStr = safeString(state.script_address);
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
                displayText={truncateHex(ownerStr, 16, 12)}
                className="font-mono text-primary-light"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={truncateHex(scriptAddrStr, 12, 8)}
                className="font-mono text-accent-yellow"
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

// Script input item component
function ScriptInputItem({ input, index }: { input: any; index: number }) {
  const coin = input.input?.Coin;
  const state = input.input?.State;
  const inType = safeString(input.in_type) || 'Unknown';

  if (coin) {
    const txid = getTxid(coin.utxo);
    const outputIndex = getOutputIndex(coin.utxo);
    const ownerStr = safeString(coin.out_coin?.owner);
    const isNullTxid = txid === '0000000000000000000000000000000000000000000000000000000000000000';

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownLeft className="w-4 h-4 text-accent-green" />
          <span className="text-white text-sm font-medium">Input #{index + 1}</span>
          <span className="badge badge-success text-xs">{inType}</span>
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
                displayText={truncateHex(ownerStr, 16, 12)}
                className="font-mono text-primary-light"
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
    const isNullTxid = txid === '0000000000000000000000000000000000000000000000000000000000000000';

    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDownLeft className="w-4 h-4 text-accent-yellow" />
          <span className="text-white text-sm font-medium">Input #{index + 1}</span>
          <span className="badge badge-warning text-xs">{inType}</span>
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
                displayText={truncateHex(ownerStr, 16, 12)}
                className="font-mono text-primary-light"
              />
            </div>
          )}
          {scriptAddrStr && (
            <div className="flex items-start gap-2">
              <span className="text-text-secondary min-w-[100px]">Script:</span>
              <CopyableText
                text={scriptAddrStr}
                displayText={truncateHex(scriptAddrStr, 12, 8)}
                className="font-mono text-accent-yellow"
              />
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

// Script transaction viewer
function ScriptViewer({ tx, summary }: { tx: any; summary?: ZkosSummary }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [showProgram, setShowProgram] = useState(true);
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

// Transfer transaction viewer
function TransferViewer({ tx, summary }: { tx: TransferTransaction; summary?: ZkosSummary }) {
  const [showWitness, setShowWitness] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const transfer = tx.TransactionTransfer;

  if (!transfer) {
    return <div className="text-text-muted">Invalid transfer transaction data</div>;
  }

  const witnessCount = transfer.witness_count || (Array.isArray(transfer.witness) ? transfer.witness.length : 0);
  const hasWitness = witnessCount > 0 || (transfer.witness && transfer.witness.length > 0);
  const hasProof = transfer.proof && Object.keys(transfer.proof).length > 0;

  // Extract order details from summary
  const orderType = summary?.order_type;
  const programType = summary?.program_type;

  // Extract order side and position size from Memo outputs
  let orderSide: string | undefined;
  let positionSize: number | undefined;
  let entryPrice: number | undefined;
  let leverage: string | number | undefined;

  if (transfer.outputs) {
    for (const output of transfer.outputs) {
      const memo = output.output?.Memo;
      if (memo?.data) {
        const memoData = extractValue(memo.data);
        if (Array.isArray(memoData) && memoData.length > 0) {
          const firstItem = memoData[0];
          if (firstItem?.order_side) orderSide = firstItem.order_side;
          if (firstItem?.position_size !== undefined) positionSize = firstItem.position_size;
          if (firstItem?.entry_price !== undefined) entryPrice = firstItem.entry_price;
          if (firstItem?.leverage !== undefined) leverage = firstItem.leverage;
        }
      }
    }
  }

  const hasOrderDetails = orderType || programType || orderSide || positionSize !== undefined;

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

      {/* Order Details Section */}
      {hasOrderDetails && (
        <div className="bg-background-secondary rounded-lg p-4 border border-border/50">
          <h4 className="text-sm font-medium text-text-secondary uppercase mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Order Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {orderType && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Order Type</span>
                <span className="text-white font-medium">{orderType}</span>
              </div>
            )}
            {programType && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Program Type</span>
                <span className="text-white font-medium">{programType}</span>
              </div>
            )}
            {orderSide && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Order Side</span>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase',
                    orderSide.toLowerCase() === 'long' && 'bg-accent-green/20 text-accent-green',
                    orderSide.toLowerCase() === 'short' && 'bg-accent-orange/20 text-accent-orange'
                  )}
                >
                  {orderSide.toLowerCase() === 'long' && <TrendingUp className="w-3 h-3" />}
                  {orderSide.toLowerCase() === 'short' && <TrendingDown className="w-3 h-3" />}
                  {orderSide}
                </span>
              </div>
            )}
            {positionSize !== undefined && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Position Size</span>
                <span className="text-white font-medium">{formatPositionSize(positionSize)}</span>
              </div>
            )}
            {entryPrice !== undefined && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Entry Price</span>
                <span className="text-white font-medium">{formatPrice(entryPrice)}</span>
              </div>
            )}
            {leverage !== undefined && (
              <div>
                <span className="text-text-muted text-xs block mb-1">Leverage</span>
                <span className="text-accent-yellow font-medium">
                  {typeof leverage === 'string' && leverage.includes('encrypted')
                    ? '(encrypted)'
                    : `${leverage}x`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Witness Section (collapsible) */}
      {hasWitness && (
        <div>
          <button
            onClick={() => setShowWitness(!showWitness)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
          >
            {showWitness ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Eye className="w-4 h-4" />
            Witness Data ({witnessCount} {witnessCount === 1 ? 'witness' : 'witnesses'})
          </button>
          {showWitness && (
            <div className="mt-2 bg-background-secondary rounded-lg p-3 border border-border/50">
              {Array.isArray(transfer.witness) && transfer.witness.length > 0 ? (
                <div className="space-y-3">
                  {transfer.witness.map((wit: any, idx: number) => {
                    const valueWitness = wit?.valueWitness || wit?.value_witness;
                    const sign = valueWitness?.sign;
                    const valueProof = wit?.value_proof || wit?.valueProof;

                    return (
                      <div key={idx} className="bg-background-primary/30 rounded p-3">
                        <div className="text-xs text-text-muted mb-2 font-medium">Witness #{idx + 1}</div>

                        {/* Sign from valueWitness */}
                        {sign !== undefined && (
                          <div className="mb-2">
                            <div className="text-xs text-text-muted mb-1">Sign (valueWitness)</div>
                            <span className={clsx(
                              'inline-block px-2 py-0.5 rounded text-xs font-mono',
                              sign === 1 || sign === 'positive' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-orange/20 text-accent-orange'
                            )}>
                              {sign === 1 || sign === 'positive' ? 'Positive (+1)' : sign === -1 || sign === 'negative' ? 'Negative (-1)' : String(sign)}
                            </span>
                          </div>
                        )}

                        {/* Value Proof */}
                        {valueProof && (
                          <div className="mb-2">
                            <div className="text-xs text-text-muted mb-1">Value Proof</div>
                            <pre className="text-xs text-text-secondary bg-background-primary/50 rounded p-2 overflow-x-auto max-h-24">
                              {typeof valueProof === 'string'
                                ? truncateHex(valueProof, 32, 16)
                                : JSON.stringify(valueProof, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Show full witness if no specific fields found */}
                        {!sign && !valueProof && (
                          <pre className="text-xs text-text-secondary overflow-x-auto">
                            {typeof wit === 'string' ? truncateHex(wit, 32, 16) : JSON.stringify(wit, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-text-muted text-sm">No witness data available</span>
              )}
            </div>
          )}
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
            <div className="mt-2 bg-background-secondary rounded-lg p-3 border border-border/50">
              <div className="space-y-3">
                {transfer.proof?.delta_dleq && (
                  <div>
                    <div className="text-xs text-text-muted mb-1">Delta DLEQ</div>
                    <pre className="text-xs text-text-secondary bg-background-primary/30 rounded p-2 overflow-x-auto">
                      {typeof transfer.proof.delta_dleq === 'string'
                        ? truncateHex(transfer.proof.delta_dleq, 32, 16)
                        : JSON.stringify(transfer.proof.delta_dleq, null, 2)}
                    </pre>
                  </div>
                )}
                {transfer.proof?.aggregated_eq_proof && (
                  <div>
                    <div className="text-xs text-text-muted mb-1">Aggregated Equality Proof</div>
                    <pre className="text-xs text-text-secondary bg-background-primary/30 rounded p-2 overflow-x-auto max-h-32">
                      {typeof transfer.proof.aggregated_eq_proof === 'string'
                        ? truncateHex(transfer.proof.aggregated_eq_proof, 32, 16)
                        : JSON.stringify(transfer.proof.aggregated_eq_proof, null, 2)}
                    </pre>
                  </div>
                )}
                {/* Show full proof JSON if no specific fields are displayed */}
                {!transfer.proof?.delta_dleq && !transfer.proof?.aggregated_eq_proof && (
                  <pre className="text-xs text-text-secondary overflow-x-auto max-h-48">
                    {JSON.stringify(transfer.proof, null, 2)}
                  </pre>
                )}
              </div>
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
