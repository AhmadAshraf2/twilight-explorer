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

interface ZkosSummary {
  input_type?: string;
  output_type?: string;
  order_operation?: string;
  order_operation_description?: string;
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
    return (
      <div className="bg-background-secondary rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent-blue" />
          <span className="text-white text-sm font-medium">Output #{index + 1}</span>
          <span className="badge badge-info text-xs">Memo</span>
        </div>
        <div className="space-y-1 text-sm pl-6">
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

// Opcode display component
function OpcodeItem({ opcode, index }: { opcode: string | any; index: number }) {
  // Extract value if opcode is an object
  const opcodeStr = safeString(opcode);

  // Color coding for different opcode types
  const getOpcodeStyle = (op: string) => {
    if (op.startsWith('PUSH')) return 'text-accent-green';
    if (op.startsWith('OP_')) return 'text-accent-blue';
    if (op === 'ADD' || op === 'SUB' || op === 'MUL' || op === 'DIV') return 'text-accent-yellow';
    if (op === 'VERIFY' || op === 'ASSERT') return 'text-accent-orange';
    return 'text-primary-light';
  };

  return (
    <span
      className={clsx(
        'inline-block px-2 py-1 rounded text-xs font-mono',
        'bg-background-primary/50 border border-border/30',
        getOpcodeStyle(opcodeStr)
      )}
    >
      {opcodeStr}
    </span>
  );
}

// Script transaction viewer
function ScriptViewer({ tx, summary }: { tx: any; summary?: ZkosSummary }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showProgram, setShowProgram] = useState(true);
  const script = tx.TransactionScript;

  // Get input/output types from summary or from tx data
  const inputType = safeString(summary?.input_type || script?.inputs?.[0]?.in_type) || 'Unknown';
  const outputType = safeString(summary?.output_type || script?.outputs?.[0]?.out_type) || 'Unknown';

  if (!script) {
    return <div className="text-text-muted">Invalid script transaction data</div>;
  }

  // Get program/opcodes from various possible locations
  const program = script.program || script.opcodes || script.code || [];
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
                  <OpcodeItem key={idx} opcode={opcode} index={idx} />
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

      {/* Technical Details (collapsible) */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
        >
          {showDetails ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Technical Details
        </button>
        {showDetails && (
          <div className="mt-2 bg-background-secondary rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Proof Size:</span>
              <span className="text-white">{Array.isArray(script.proof) ? script.proof.length : 0} bytes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Commitments:</span>
              <span className="text-white">{Array.isArray(script.commitments) ? script.commitments.length : 0}</span>
            </div>
          </div>
        )}
      </div>

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
function TransferViewer({ tx }: { tx: TransferTransaction }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const transfer = tx.TransactionTransfer;

  if (!transfer) {
    return <div className="text-text-muted">Invalid transfer transaction data</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
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

      {/* Technical Details (collapsible) */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
        >
          {showDetails ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Technical Details
        </button>
        {showDetails && (
          <div className="mt-2 bg-background-secondary rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Witness Count:</span>
              <span className="text-white">
                {safeString(transfer.witness_count) || (Array.isArray(transfer.witness) ? transfer.witness.length : 0)}
              </span>
            </div>
            {transfer.proof && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Proof Type:</span>
                <span className="text-white">
                  {transfer.proof.delta_dleq ? 'DarkTxProof' : 'ShuffleTxProof'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

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
  const operation = safeString(summary.order_operation);
  if (!operation) return null;

  const config = getOrderOperationConfig(operation);
  const Icon = config.icon;
  const orderSize = summary.outputs?.[0]?.order_size;

  return (
    <div className={clsx('rounded-lg p-4 mb-4 border border-border/50', config.bgColor)}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background-primary/50">
          <Icon className={clsx('w-5 h-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('font-semibold', config.color)}>{config.label}</span>
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

        {txType === 'Transfer' && <TransferViewer tx={tx} />}
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
