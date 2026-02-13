import * as grpc from '@grpc/grpc-js';
import { config } from './config.js';
import { logger } from './logger.js';

// Import generated service client constructors
import {
  ServiceClient as TendermintServiceConstructor,
} from './generated/cosmos/base/tendermint/v1beta1/query.js';
import {
  ServiceClient as TxServiceConstructor,
} from './generated/cosmos/tx/v1beta1/service.js';
import {
  QueryClient as BridgeQueryConstructor,
} from './generated/nyks/bridge/query.js';
import {
  QueryClient as VoltQueryConstructor,
} from './generated/nyks/volt/query.js';
import {
  QueryClient as ForksQueryConstructor,
} from './generated/nyks/forks/query.js';
import {
  QueryClient as ZkosQueryConstructor,
} from './generated/nyks/zkos/query.js';
import {
  QueryClient as AuthQueryConstructor,
} from './generated/cosmos/auth/v1beta1/query.js';
import {
  QueryClient as BankQueryConstructor,
} from './generated/cosmos/bank/v1beta1/query.js';

// Import generated message decoders for Any unpacking
import {
  MsgConfirmBtcDeposit,
  MsgRegisterBtcDepositAddress,
  MsgRegisterReserveAddress,
  MsgBootstrapFragment,
  MsgWithdrawBtcRequest,
  MsgSweepProposal,
  MsgWithdrawTxSigned,
  MsgWithdrawTxFinal,
  MsgConfirmBtcWithdraw,
  MsgSignRefund,
  MsgBroadcastTxSweep,
  MsgSignSweep,
  MsgProposeRefundHash,
  MsgUnsignedTxSweep,
  MsgUnsignedTxRefund,
  MsgBroadcastTxRefund,
  MsgProposeSweepAddress,
} from './generated/nyks/bridge/tx.js';
import {
  MsgSetDelegateAddresses,
  MsgSeenBtcChainTip,
} from './generated/nyks/forks/tx.js';
import {
  MsgTransferTx,
  MsgMintBurnTradingBtc,
} from './generated/nyks/zkos/tx.js';
import {
  MsgSend,
  MsgMultiSend,
} from './generated/cosmos/bank/v1beta1/tx.js';
import {
  MsgCreateValidator,
  MsgEditValidator,
  MsgDelegate,
  MsgBeginRedelegate,
  MsgUndelegate,
} from './generated/cosmos/staking/v1beta1/tx.js';
import {
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission,
  MsgFundCommunityPool,
} from './generated/cosmos/distribution/v1beta1/tx.js';
import {
  MsgSubmitProposal,
  MsgVote,
  MsgVoteWeighted,
  MsgDeposit,
} from './generated/cosmos/gov/v1beta1/tx.js';
import {
  MsgUnjail,
} from './generated/cosmos/slashing/v1beta1/tx.js';

// Import generated request types
import type { OrderBy } from './generated/cosmos/tx/v1beta1/service.js';

// Import LCD types for return type compatibility
import type {
  Block,
  TxResponse,
  Pagination,
  BtcReserveResponse,
  DelegateKeysResponse,
} from './lcd-client.js';

// ============================================
// Message Decoder Registry
// ============================================

// Maps proto typeUrl -> decoder with encode/decode methods
const messageDecoders: Record<string, { decode: (input: Uint8Array, length?: number) => any }> = {
  // Bridge Module (17 types)
  '/twilightproject.nyks.bridge.MsgConfirmBtcDeposit': MsgConfirmBtcDeposit,
  '/twilightproject.nyks.bridge.MsgRegisterBtcDepositAddress': MsgRegisterBtcDepositAddress,
  '/twilightproject.nyks.bridge.MsgRegisterReserveAddress': MsgRegisterReserveAddress,
  '/twilightproject.nyks.bridge.MsgBootstrapFragment': MsgBootstrapFragment,
  '/twilightproject.nyks.bridge.MsgWithdrawBtcRequest': MsgWithdrawBtcRequest,
  '/twilightproject.nyks.bridge.MsgSweepProposal': MsgSweepProposal,
  '/twilightproject.nyks.bridge.MsgWithdrawTxSigned': MsgWithdrawTxSigned,
  '/twilightproject.nyks.bridge.MsgWithdrawTxFinal': MsgWithdrawTxFinal,
  '/twilightproject.nyks.bridge.MsgConfirmBtcWithdraw': MsgConfirmBtcWithdraw,
  '/twilightproject.nyks.bridge.MsgSignRefund': MsgSignRefund,
  '/twilightproject.nyks.bridge.MsgBroadcastTxSweep': MsgBroadcastTxSweep,
  '/twilightproject.nyks.bridge.MsgSignSweep': MsgSignSweep,
  '/twilightproject.nyks.bridge.MsgProposeRefundHash': MsgProposeRefundHash,
  '/twilightproject.nyks.bridge.MsgUnsignedTxSweep': MsgUnsignedTxSweep,
  '/twilightproject.nyks.bridge.MsgUnsignedTxRefund': MsgUnsignedTxRefund,
  '/twilightproject.nyks.bridge.MsgBroadcastTxRefund': MsgBroadcastTxRefund,
  '/twilightproject.nyks.bridge.MsgProposeSweepAddress': MsgProposeSweepAddress,
  // Forks Module (2 types)
  '/twilightproject.nyks.forks.MsgSetDelegateAddresses': MsgSetDelegateAddresses,
  '/twilightproject.nyks.forks.MsgSeenBtcChainTip': MsgSeenBtcChainTip,
  // zkOS Module (2 types)
  '/twilightproject.nyks.zkos.MsgTransferTx': MsgTransferTx,
  '/twilightproject.nyks.zkos.MsgMintBurnTradingBtc': MsgMintBurnTradingBtc,
  // Cosmos SDK standard messages - bank
  '/cosmos.bank.v1beta1.MsgSend': MsgSend,
  '/cosmos.bank.v1beta1.MsgMultiSend': MsgMultiSend,
  // Cosmos SDK standard messages - staking
  '/cosmos.staking.v1beta1.MsgCreateValidator': MsgCreateValidator,
  '/cosmos.staking.v1beta1.MsgEditValidator': MsgEditValidator,
  '/cosmos.staking.v1beta1.MsgDelegate': MsgDelegate,
  '/cosmos.staking.v1beta1.MsgBeginRedelegate': MsgBeginRedelegate,
  '/cosmos.staking.v1beta1.MsgUndelegate': MsgUndelegate,
  // Cosmos SDK standard messages - distribution
  '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress': MsgSetWithdrawAddress,
  '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': MsgWithdrawDelegatorReward,
  '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission': MsgWithdrawValidatorCommission,
  '/cosmos.distribution.v1beta1.MsgFundCommunityPool': MsgFundCommunityPool,
  // Cosmos SDK standard messages - gov
  '/cosmos.gov.v1beta1.MsgSubmitProposal': MsgSubmitProposal,
  '/cosmos.gov.v1beta1.MsgVote': MsgVote,
  '/cosmos.gov.v1beta1.MsgVoteWeighted': MsgVoteWeighted,
  '/cosmos.gov.v1beta1.MsgDeposit': MsgDeposit,
  // Cosmos SDK standard messages - slashing
  '/cosmos.slashing.v1beta1.MsgUnjail': MsgUnjail,
};

// ============================================
// Helper: Promisify gRPC unary call
// ============================================

function unaryCall<TReq, TRes>(
  client: grpc.Client,
  method: Function,
  request: TReq,
  deadlineMs: number = 30000,
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const deadline = new Date(Date.now() + deadlineMs);
    method.call(client, request, { deadline }, (err: grpc.ServiceError | null, res: TRes) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

// ============================================
// Helper: Decode google.protobuf.Any message
// ============================================

function decodeAnyMessage(any: { typeUrl: string; value: Uint8Array }): Record<string, unknown> {
  const decoder = messageDecoders[any.typeUrl];
  if (decoder) {
    const decoded = decoder.decode(any.value);
    return { '@type': any.typeUrl, ...decoded };
  }
  // Unknown type - return raw base64
  return {
    '@type': any.typeUrl,
    value: Buffer.from(any.value).toString('base64'),
  };
}

// ============================================
// Helper: Convert bytes to hex string
// ============================================

function bytesToHex(bytes: Uint8Array | Buffer | undefined): string {
  if (!bytes || bytes.length === 0) return '';
  return Buffer.from(bytes).toString('hex').toUpperCase();
}

// ============================================
// Response Transformers
// ============================================

function transformBlockResponse(grpcResp: any): Block {
  const block = grpcResp.block;
  const blockId = grpcResp.blockId;
  const header = block?.header;

  return {
    block_id: {
      hash: bytesToHex(blockId?.hash),
      part_set_header: {
        total: blockId?.partSetHeader?.total || 0,
        hash: bytesToHex(blockId?.partSetHeader?.hash),
      },
    },
    block: {
      header: {
        version: {
          block: header?.version?.block || '0',
          app: header?.version?.app || '0',
        },
        chain_id: header?.chainId || '',
        height: header?.height || '0',
        time: header?.time instanceof Date ? header.time.toISOString() : new Date().toISOString(),
        last_block_id: {
          hash: bytesToHex(header?.lastBlockId?.hash),
          part_set_header: {
            total: header?.lastBlockId?.partSetHeader?.total || 0,
            hash: bytesToHex(header?.lastBlockId?.partSetHeader?.hash),
          },
        },
        last_commit_hash: bytesToHex(header?.lastCommitHash),
        data_hash: bytesToHex(header?.dataHash),
        validators_hash: bytesToHex(header?.validatorsHash),
        next_validators_hash: bytesToHex(header?.nextValidatorsHash),
        consensus_hash: bytesToHex(header?.consensusHash),
        app_hash: bytesToHex(header?.appHash),
        last_results_hash: bytesToHex(header?.lastResultsHash),
        evidence_hash: bytesToHex(header?.evidenceHash),
        proposer_address: bytesToHex(header?.proposerAddress),
      },
      data: {
        txs: (block?.data?.txs || []).map((tx: Uint8Array) =>
          Buffer.from(tx).toString('base64')
        ),
      },
      evidence: {
        evidence: [],
      },
      last_commit: {
        height: block?.lastCommit?.height || '0',
        round: block?.lastCommit?.round || 0,
        block_id: {
          hash: bytesToHex(block?.lastCommit?.blockId?.hash),
          part_set_header: {
            total: block?.lastCommit?.blockId?.partSetHeader?.total || 0,
            hash: bytesToHex(block?.lastCommit?.blockId?.partSetHeader?.hash),
          },
        },
        signatures: (block?.lastCommit?.signatures || []).map((sig: any) => ({
          block_id_flag: sig.blockIdFlag?.toString() || '0',
          validator_address: bytesToHex(sig.validatorAddress),
          timestamp: sig.timestamp instanceof Date ? sig.timestamp.toISOString() : '',
          signature: sig.signature ? Buffer.from(sig.signature).toString('base64') : '',
        })),
      },
    },
  };
}

function transformTxResponse(grpcTxResp: any, decodedTx?: any): TxResponse {
  // Decode the messages from the Any-wrapped tx
  let txBody: any = null;
  let txAuthInfo: any = null;
  let txSignatures: string[] = [];

  if (decodedTx) {
    // If we have the decoded Tx object (from GetTxsEvent.txs[])
    txBody = decodedTx.body;
    txAuthInfo = decodedTx.authInfo;
    txSignatures = (decodedTx.signatures || []).map((sig: Uint8Array) =>
      Buffer.from(sig).toString('base64')
    );
  } else if (grpcTxResp.tx?.typeUrl && grpcTxResp.tx?.value) {
    // Fallback: decode from Any
    try {
      const { Tx } = require('./generated/cosmos/tx/v1beta1/tx.js');
      const decoded = Tx.decode(grpcTxResp.tx.value);
      txBody = decoded.body;
      txAuthInfo = decoded.authInfo;
      txSignatures = (decoded.signatures || []).map((sig: Uint8Array) =>
        Buffer.from(sig).toString('base64')
      );
    } catch {
      // Could not decode tx
    }
  }

  // Decode messages from Any to JSON with @type
  const messages = (txBody?.messages || []).map((msg: any) => {
    if (msg.typeUrl && msg.value) {
      return decodeAnyMessage(msg);
    }
    // Already decoded or plain object
    return msg;
  });

  // Transform signer_infos
  const signerInfos = (txAuthInfo?.signerInfos || []).map((si: any) => ({
    public_key: si.publicKey
      ? {
          '@type': si.publicKey.typeUrl || '',
          key: si.publicKey.value
            ? Buffer.from(si.publicKey.value).toString('base64')
            : '',
        }
      : null,
    mode_info: si.modeInfo || null,
    sequence: si.sequence || '0',
  }));

  // Transform fee
  const fee = txAuthInfo?.fee
    ? {
        amount: (txAuthInfo.fee.amount || []).map((coin: any) => ({
          denom: coin.denom || '',
          amount: coin.amount || '0',
        })),
        gas_limit: txAuthInfo.fee.gasLimit || '0',
        payer: txAuthInfo.fee.payer || '',
        granter: txAuthInfo.fee.granter || '',
      }
    : { amount: [], gas_limit: '0', payer: '', granter: '' };

  // Transform events
  const events = (grpcTxResp.events || []).map((event: any) => ({
    type: event.type || '',
    attributes: (event.attributes || []).map((attr: any) => ({
      key: typeof attr.key === 'string' ? attr.key : Buffer.from(attr.key || []).toString(),
      value: typeof attr.value === 'string' ? attr.value : Buffer.from(attr.value || []).toString(),
      index: attr.index || false,
    })),
  }));

  // Transform logs
  const logs = (grpcTxResp.logs || []).map((log: any) => ({
    msg_index: log.msgIndex || 0,
    log: log.log || '',
    events: (log.events || []).map((event: any) => ({
      type: event.type || '',
      attributes: (event.attributes || []).map((attr: any) => ({
        key: attr.key || '',
        value: attr.value || '',
      })),
    })),
  }));

  return {
    height: grpcTxResp.height || '0',
    txhash: grpcTxResp.txhash || '',
    codespace: grpcTxResp.codespace || '',
    code: grpcTxResp.code || 0,
    data: grpcTxResp.data || '',
    raw_log: grpcTxResp.rawLog || '',
    logs,
    info: grpcTxResp.info || '',
    gas_wanted: grpcTxResp.gasWanted || '0',
    gas_used: grpcTxResp.gasUsed || '0',
    tx: {
      '@type': '/cosmos.tx.v1beta1.Tx',
      body: {
        messages,
        memo: txBody?.memo || '',
        timeout_height: txBody?.timeoutHeight || '0',
        extension_options: txBody?.extensionOptions || [],
        non_critical_extension_options: txBody?.nonCriticalExtensionOptions || [],
      },
      auth_info: {
        signer_infos: signerInfos,
        fee,
      },
      signatures: txSignatures,
    },
    timestamp: grpcTxResp.timestamp || '',
    events,
  };
}

// ============================================
// gRPC Client Class
// ============================================

export class TwilightGrpcClient {
  private tendermint: InstanceType<typeof TendermintServiceConstructor>;
  private txService: InstanceType<typeof TxServiceConstructor>;
  private bridge: InstanceType<typeof BridgeQueryConstructor>;
  private volt: InstanceType<typeof VoltQueryConstructor>;
  private forks: InstanceType<typeof ForksQueryConstructor>;
  private zkos: InstanceType<typeof ZkosQueryConstructor>;
  private auth: InstanceType<typeof AuthQueryConstructor>;
  private bank: InstanceType<typeof BankQueryConstructor>;

  constructor(grpcUrl: string = config.grpcUrl) {
    const credentials = config.grpcTls
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();

    const channelOptions: grpc.ChannelOptions = {
      'grpc.keepalive_time_ms': 10000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': 1,
      'grpc.max_receive_message_length': 50 * 1024 * 1024, // 50MB
      'grpc.initial_reconnect_backoff_ms': 1000,
      'grpc.max_reconnect_backoff_ms': 10000,
    };

    this.tendermint = new TendermintServiceConstructor(grpcUrl, credentials, channelOptions);
    this.txService = new TxServiceConstructor(grpcUrl, credentials, channelOptions);
    this.bridge = new BridgeQueryConstructor(grpcUrl, credentials, channelOptions);
    this.volt = new VoltQueryConstructor(grpcUrl, credentials, channelOptions);
    this.forks = new ForksQueryConstructor(grpcUrl, credentials, channelOptions);
    this.zkos = new ZkosQueryConstructor(grpcUrl, credentials, channelOptions);
    this.auth = new AuthQueryConstructor(grpcUrl, credentials, channelOptions);
    this.bank = new BankQueryConstructor(grpcUrl, credentials, channelOptions);

    logger.info({ grpcUrl }, 'gRPC clients initialized');
  }

  // ============================================
  // Connection Management
  // ============================================

  async waitForReady(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const deadline = new Date(Date.now() + timeoutMs);
      this.tendermint.waitForReady(deadline, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close(): void {
    this.tendermint.close();
    this.txService.close();
    this.bridge.close();
    this.volt.close();
    this.forks.close();
    this.zkos.close();
    this.auth.close();
    this.bank.close();
    logger.info('gRPC clients closed');
  }

  // ============================================
  // Block Endpoints
  // ============================================

  async getLatestBlock(): Promise<Block> {
    const resp = await unaryCall<any, any>(
      this.tendermint,
      this.tendermint.getLatestBlock,
      {},
    );
    return transformBlockResponse(resp);
  }

  async getBlockByHeight(height: number): Promise<Block> {
    const resp = await unaryCall<any, any>(
      this.tendermint,
      this.tendermint.getBlockByHeight,
      { height: height.toString() },
    );
    return transformBlockResponse(resp);
  }

  async getLatestBlockHeight(): Promise<number> {
    const block = await this.getLatestBlock();
    return parseInt(block.block.header.height, 10);
  }

  // ============================================
  // Transaction Endpoints
  // ============================================

  async getTxsByHeight(height: number): Promise<{ tx_responses: TxResponse[]; pagination: Pagination }> {
    const resp = await unaryCall<any, any>(
      this.txService,
      this.txService.getTxsEvent,
      {
        events: [`tx.height=${height}`],
        pagination: { key: Buffer.alloc(0), offset: '0', limit: '100', countTotal: true },
        orderBy: 0, // ORDER_BY_UNSPECIFIED
      },
    );

    // resp.txs[] = decoded Tx objects, resp.txResponses[] = TxResponse metadata
    const txResponses = (resp.txResponses || []).map((txResp: any, i: number) => {
      const decodedTx = resp.txs?.[i];
      return transformTxResponse(txResp, decodedTx);
    });

    return {
      tx_responses: txResponses,
      pagination: {
        next_key: resp.pagination?.nextKey
          ? Buffer.from(resp.pagination.nextKey).toString('base64')
          : null,
        total: resp.pagination?.total || '0',
      },
    };
  }

  async getTx(hash: string): Promise<{ tx_response: TxResponse }> {
    const resp = await unaryCall<any, any>(
      this.txService,
      this.txService.getTx,
      { hash },
    );
    return {
      tx_response: transformTxResponse(resp.txResponse, resp.tx),
    };
  }

  // ============================================
  // Volt Module Queries
  // ============================================

  async getBtcReserves(): Promise<BtcReserveResponse> {
    const resp = await unaryCall<any, any>(
      this.volt,
      this.volt.btcReserve,
      {},
    );
    return {
      btcReserves: (resp.btcReserves || []).map((r: any) => ({
        ReserveId: r.reserveId || '0',
        ReserveAddress: r.reserveAddress || '',
        JudgeAddress: r.judgeAddress || '',
        BtcRelayCapacityValue: r.btcRelayCapacityValue || '0',
        TotalValue: r.totalValue || '0',
        PrivatePoolValue: r.privatePoolValue || '0',
        PublicValue: r.publicValue || '0',
        FeePool: r.feePool || '0',
        UnlockHeight: r.unlockHeight || '0',
        RoundId: r.roundId || '0',
      })),
    };
  }

  async getClearingAccount(twilightAddress: string): Promise<unknown> {
    return unaryCall<any, any>(
      this.volt,
      this.volt.clearingAccount,
      { twilightAddress },
    );
  }

  async getFragments(): Promise<unknown> {
    return unaryCall<any, any>(
      this.volt,
      this.volt.getAllFragments,
      {},
    );
  }

  async getFragmentById(fragmentId: number): Promise<unknown> {
    return unaryCall<any, any>(
      this.volt,
      this.volt.fragmentById,
      { fragmentId: fragmentId.toString() },
    );
  }

  // ============================================
  // Bridge Module Queries
  // ============================================

  async getRegisteredDepositAddresses(): Promise<unknown> {
    return unaryCall<any, any>(
      this.bridge,
      this.bridge.registeredBtcDepositAddresses,
      {},
    );
  }

  async getRegisteredReserveAddresses(): Promise<unknown> {
    return unaryCall<any, any>(
      this.bridge,
      this.bridge.registeredReserveAddresses,
      {},
    );
  }

  async getWithdrawRequests(): Promise<unknown> {
    return unaryCall<any, any>(
      this.bridge,
      this.bridge.withdrawBtcRequestAll,
      {},
    );
  }

  // ============================================
  // Forks Module Queries
  // ============================================

  async getDelegateKeys(): Promise<DelegateKeysResponse> {
    const resp = await unaryCall<any, any>(
      this.forks,
      this.forks.delegateKeysAll,
      {},
    );
    return {
      delegateKeys: (resp.delegateKeys || []).map((dk: any) => ({
        validatorAddress: dk.validatorAddress || '',
        btcOracleAddress: dk.btcOracleAddress || '',
        btcPublicKey: dk.btcPublicKey || '',
        zkOracleAddress: dk.zkOracleAddress || '',
      })),
    };
  }

  async getAttestations(attestationType?: string, limit?: number): Promise<unknown> {
    const params: any = {};
    if (limit) params.limit = limit.toString();
    if (attestationType) params.proposalType = attestationType;
    return unaryCall<any, any>(
      this.forks,
      this.forks.getAttestations,
      params,
    );
  }

  // ============================================
  // zkOS Module Queries
  // ============================================

  async getZkosTransferTx(txId: string): Promise<unknown> {
    return unaryCall<any, any>(
      this.zkos,
      this.zkos.transferTx,
      { txId },
    );
  }

  async getMintBurnTradingBtc(twilightAddress: string): Promise<unknown> {
    return unaryCall<any, any>(
      this.zkos,
      this.zkos.mintOrBurnTradingBtc,
      { twilightAddress },
    );
  }

  // ============================================
  // Module Params
  // ============================================

  async getBridgeParams(): Promise<unknown> {
    return unaryCall<any, any>(this.bridge, this.bridge.params, {});
  }

  async getForksParams(): Promise<unknown> {
    return unaryCall<any, any>(this.forks, this.forks.params, {});
  }

  async getVoltParams(): Promise<unknown> {
    return unaryCall<any, any>(this.volt, this.volt.params, {});
  }

  async getZkosParams(): Promise<unknown> {
    return unaryCall<any, any>(this.zkos, this.zkos.params, {});
  }

  // ============================================
  // Account Queries
  // ============================================

  async getAccount(address: string): Promise<unknown> {
    return unaryCall<any, any>(this.auth, this.auth.account, { address });
  }

  async getBalance(address: string): Promise<unknown> {
    return unaryCall<any, any>(this.bank, this.bank.allBalances, { address });
  }

  // ============================================
  // Node Info
  // ============================================

  async getNodeInfo(): Promise<unknown> {
    return unaryCall<any, any>(this.tendermint, this.tendermint.getNodeInfo, {});
  }

  async getSyncingStatus(): Promise<{ syncing: boolean }> {
    const resp = await unaryCall<any, any>(
      this.tendermint,
      this.tendermint.getSyncing,
      {},
    );
    return { syncing: resp.syncing || false };
  }
}

// Export singleton instance
export const grpcClient = new TwilightGrpcClient();
