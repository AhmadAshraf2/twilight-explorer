const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Block {
  height: number;
  hash: string;
  timestamp: string;
  proposer: string | null;
  txCount: number;
  gasUsed: string;
  gasWanted: string;
}

export interface Transaction {
  hash: string;
  blockHeight: number;
  blockTime: string;
  type: string;
  messageTypes: string[];
  messages?: any[];
  status: string;
  gasUsed: string;
  gasWanted?: string;
  memo: string | null;
  fee?: any;
  errorLog?: string | null;
  signers?: string[];
  zkosDecodedData?: any;
}

export interface Stats {
  latestBlock: {
    height: number;
    hash: string;
    timestamp: string;
  } | null;
  totalBlocks: number;
  totalTransactions: number;
  totalAccounts: number;
  transactionsLast24h: number;
  transactionsByStatus: {
    success?: number;
    failed?: number;
  };
}

export interface ModuleStats {
  bridge: {
    deposits: number;
    withdrawals: number;
    depositVolume: string;
    withdrawalVolume: string;
  };
  forks: {
    delegateKeys: number;
  };
  volt: {
    fragments: number;
    activeFragments: number;
  };
  zkos: {
    transfers: number;
    mintBurns: number;
    volume: string;
  };
}

export interface Account {
  address: string;
  balance: string;
  txCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface BtcDeposit {
  id: number;
  txHash: string;
  blockHeight: number;
  reserveAddress: string;
  depositAmount: string;
  btcHeight: string;
  btcHash: string;
  twilightDepositAddress: string;
  oracleAddress: string;
  createdAt: string;
}

export interface BtcWithdrawal {
  id: number;
  txHash: string;
  blockHeight: number;
  withdrawAddress: string;
  reserveId: string;
  withdrawAmount: string;
  twilightAddress: string;
  status: string;
  btcTxHash: string | null;
  createdAt: string;
}

export interface Fragment {
  id: string;
  txHash: string;
  blockHeight: number;
  judgeAddress: string;
  status: boolean;
  threshold: number;
  signerApplicationFee: string;
  feePool: string;
  feeBips: number;
  signersCount: number;
  arbitraryData: string | null;
  createdAt: string;
}

export interface FragmentSignerLive {
  fragmentId: string;
  signerAddress: string;
  status: boolean;
  btcPubKey: string;
  applicationFee: string;
  feeBips: number;
}

export interface FragmentLive {
  id: string;
  status: boolean;
  judgeAddress: string;
  judgeStatus: boolean;
  threshold: number;
  signerApplicationFee: string;
  feePool: string;
  feeBips: number;
  arbitraryData: string | null;
  reserveIds: string[];
  signers: FragmentSignerLive[];
  signersCount: number;
}

export interface FragmentsLiveResponse {
  data: FragmentLive[];
  total: number;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Stats
export const getStats = () => fetchApi<Stats>('/api/stats');
export const getModuleStats = () => fetchApi<ModuleStats>('/api/stats/modules');

// Blocks
export const getBlocks = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Block>>(`/api/blocks?page=${page}&limit=${limit}`);

export const getLatestBlock = () => fetchApi<Block>('/api/blocks/latest');

export const getBlock = (height: number) => fetchApi<Block>(`/api/blocks/${height}`);

// Transactions
export const getTransactions = (page = 1, limit = 20, filters?: { type?: string; status?: string; module?: string }) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.module) params.set('module', filters.module);
  return fetchApi<PaginatedResponse<Transaction>>(`/api/txs?${params}`);
};

export const getRecentTransactions = (limit = 10) =>
  fetchApi<Transaction[]>(`/api/txs/recent?limit=${limit}`);

export const getTransaction = (hash: string) =>
  fetchApi<Transaction>(`/api/txs/${hash}`);

export interface FragmentSigner {
  id: number;
  fragmentId: string;
  txHash: string;
  blockHeight: number;
  applicationFee: string;
  feeBips: number;
  btcPubKey: string;
  signerAddress: string;
  status: string;
  createdAt: string;
}

// Coin balance from LCD
export interface CoinBalance {
  denom: string;
  amount: string;
}

// Accounts
export const getAccount = (address: string) =>
  fetchApi<{
    account: Account | null;
    balances: CoinBalance[];
    deposits: BtcDeposit[];
    withdrawals: BtcWithdrawal[];
    clearingAccount: any;
    zkosOperations: any[];
    fragmentSigners: FragmentSigner[];
  }>(`/api/accounts/${address}`);

export const getAccountTransactions = (address: string, page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Transaction>>(`/api/accounts/${address}/transactions?page=${page}&limit=${limit}`);

// Twilight-specific
export const getDeposits = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<BtcDeposit>>(`/api/twilight/deposits?page=${page}&limit=${limit}`);

export const getWithdrawals = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<BtcWithdrawal>>(`/api/twilight/withdrawals?page=${page}&limit=${limit}`);

export const getReserves = () => fetchApi<any[]>('/api/twilight/reserves');

export const getFragments = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Fragment>>(`/api/twilight/fragments?page=${page}&limit=${limit}`);

export const getFragmentsLive = () =>
  fetchApi<FragmentsLiveResponse>('/api/twilight/fragments/live');

export const getZkosTransfers = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<any>>(`/api/twilight/zkos/transfers?page=${page}&limit=${limit}`);

export const search = (query: string) =>
  fetchApi<any>(`/api/twilight/search?q=${encodeURIComponent(query)}`);
