const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://explorer.twilight.org';

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
  programType?: string | null;
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

export interface NetworkPerformance {
  averageBlockTime: number;
  tps: number;
  blockProductionRate: number;
  gasUtilization: number;
  proposerDistribution: {
    address: string;
    blocks: number;
    percentage: number;
  }[];
}

export interface ActiveAccounts {
  active24h: number;
  active7d: number;
  active30d: number;
  newAccounts24h: number;
  growthRate: number;
}

export interface BridgeAnalytics {
  totalVolume: string;
  depositVolume24h: string;
  withdrawalVolume24h: string;
  pendingWithdrawals: number;
  confirmedWithdrawals: number;
  averageDepositSize: string;
  averageWithdrawalSize: string;
  withdrawalSuccessRate: number;
}

export interface FragmentHealth {
  totalFragments: number;
  activeFragments: number;
  bootstrappingFragments: number;
  inactiveFragments: number;
  averageSignersPerFragment: number;
  totalSigners: number;
  fragmentSuccessRate: number;
  averageFeePool: string;
  topFragments: {
    fragmentId: string;
    judgeAddress: string;
    feePool: string;
    signersCount: number;
    status: string;
  }[];
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
  withdrawIdentifier: number;
  withdrawAddress: string;
  withdrawReserveId: string;
  withdrawAmount: string;
  twilightAddress: string;
  isConfirmed: boolean;
  blockHeight: number;
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
export const getNetworkPerformance = () => fetchApi<NetworkPerformance>('/api/stats/network-performance');
export const getActiveAccounts = () => fetchApi<ActiveAccounts>('/api/stats/active-accounts');
export const getBridgeAnalytics = () => fetchApi<BridgeAnalytics>('/api/stats/bridge-analytics');
export const getFragmentHealth = () => fetchApi<FragmentHealth>('/api/stats/fragment-health');

// Blocks
export const getBlocks = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Block>>(`/api/blocks?page=${page}&limit=${limit}`);

export const getLatestBlock = () => fetchApi<Block>('/api/blocks/latest');

export const getBlock = (height: number) => fetchApi<Block>(`/api/blocks/${height}`);

// Transactions
export const getTransactions = (page = 1, limit = 20, filters?: { type?: string; status?: string; module?: string; programType?: string }) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.module) params.set('module', filters.module);
  if (filters?.programType) params.set('programType', filters.programType);
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
export const getDeposits = (page = 1, limit = 20, params?: { search?: string }) => {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  return fetchApi<PaginatedResponse<BtcDeposit>>(`/api/twilight/deposits?${qs}`);
};

export const getDeposit = (id: string) =>
  fetchApi<BtcDeposit>(`/api/twilight/deposits/${id}`);

export const getWithdrawals = (
  page = 1,
  limit = 20,
  params?: { confirmed?: boolean; search?: string }
) => {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params?.confirmed === true) qs.set('confirmed', 'true');
  if (params?.confirmed === false) qs.set('confirmed', 'false');
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  return fetchApi<PaginatedResponse<BtcWithdrawal>>(`/api/twilight/withdrawals?${qs}`);
};

export const getWithdrawal = (id: string) =>
  fetchApi<BtcWithdrawal>(`/api/twilight/withdrawals/${id}`);

export const getReserves = () => fetchApi<any[]>('/api/twilight/reserves');

export const getFragments = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Fragment>>(`/api/twilight/fragments?page=${page}&limit=${limit}`);

export const getFragmentsLive = () =>
  fetchApi<FragmentsLiveResponse>('/api/twilight/fragments/live');

export const getZkosTransfers = (page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<any>>(`/api/twilight/zkos/transfers?page=${page}&limit=${limit}`);

export const search = (query: string) =>
  fetchApi<any>(`/api/twilight/search?q=${encodeURIComponent(query)}`);

// Delegate keys (Forks)
export interface DelegateKey {
  id: number;
  txHash: string;
  blockHeight: number;
  validatorAddress: string;
  btcOracleAddress: string;
  btcPublicKey: string;
  zkOracleAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getDelegates = () => fetchApi<DelegateKey[]>('/api/twilight/delegates');

// Script address transactions
export const getTransactionsByScript = (scriptAddress: string, page = 1, limit = 20) =>
  fetchApi<PaginatedResponse<Transaction> & { scriptAddress: string }>(
    `/api/txs/script/${scriptAddress}?page=${page}&limit=${limit}`
  );

// Sweep Addresses from LCD
export interface SweepAddress {
  btcAddress: string;
  btcScript: string;
  reserveId: string;
  roundId: string;
  judgeAddress: string;
}

export interface SweepAddressesResponse {
  proposeSweepAddressMsgs: SweepAddress[];
}

// Sweep addresses (cached via API)
export const getSweepAddresses = (limit = 100): Promise<SweepAddressesResponse> =>
  fetchApi<SweepAddressesResponse>(`/api/twilight/sweep-addresses?limit=${limit}`);

// Single fragment from LCD (cached via API)
export const getFragment = (id: string): Promise<FragmentLive> =>
  fetchApi<FragmentLive>(`/api/twilight/fragments/live/${id}`);

// Validators (Cosmos SDK staking) from LCD
export interface LcdStakingValidator {
  operator_address: string;
  jailed: boolean;
  status: string; // e.g. "BOND_STATUS_BONDED"
  tokens: string;
  description: {
    moniker: string;
    identity?: string;
    website?: string;
    details?: string;
  };
  commission?: {
    commission_rates?: {
      rate?: string;
      max_rate?: string;
      max_change_rate?: string;
    };
  };
}

export interface LcdValidatorsResponse {
  validators: LcdStakingValidator[];
  pagination?: {
    next_key: string | null;
    total?: string;
  };
}

// Validator block production stats (from DB)
export interface ValidatorBlockStats {
  totalBlocks: number;
  blocks24h: number;
  blocks7d: number;
  percentage: number;
  lastBlock: {
    height: number;
    hash: string;
    timestamp: string;
  } | null;
}

// Get validator count (cached via API)
export async function getValidatorCount(status: string = 'BOND_STATUS_BONDED'): Promise<number> {
  const response = await fetchApi<{ count: number }>(`/api/validators/count?status=${status}`);
  return response.count;
}

// Get validators list (cached via API)
export async function getValidatorsBasic(
  limit: number = 100,
  status: string = 'BOND_STATUS_BONDED'
): Promise<LcdValidatorsResponse> {
  return fetchApi<LcdValidatorsResponse>(`/api/validators?status=${status}&limit=${limit}`);
}

// Get single validator details (cached via API)
export async function getValidator(address: string): Promise<LcdStakingValidator> {
  return fetchApi<LcdStakingValidator>(`/api/validators/${address}`);
}

// Get validator block production stats (from DB, cached via API)
export async function getValidatorBlockStats(address: string): Promise<ValidatorBlockStats> {
  return fetchApi<ValidatorBlockStats>(`/api/validators/${address}/blocks`);
}
