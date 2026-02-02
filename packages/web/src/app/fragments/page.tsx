'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Puzzle, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingTable } from '@/components/Loading';
import { getFragmentsLive, FragmentLive } from '@/lib/api';
import { useState } from 'react';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

function FragmentRow({ fragment }: { fragment: FragmentLive }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="cursor-pointer hover:bg-background-tertiary" onClick={() => setExpanded(!expanded)}>
        <td className="font-medium font-mono">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            #{fragment.id}
          </div>
        </td>
        <td>
          {fragment.status ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-green/20 text-accent-green">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-red/20 text-accent-red">
              <XCircle className="w-3 h-3" />
              Inactive
            </span>
          )}
        </td>
        <td>
          <Link
            href={`/accounts/${fragment.judgeAddress}`}
            className="font-mono text-sm text-primary-light hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {fragment.judgeAddress.substring(0, 20)}...
          </Link>
        </td>
        <td className="text-text-secondary">{fragment.threshold}</td>
        <td>
          <span className="inline-flex items-center gap-1 text-text-secondary">
            <Users className="w-3 h-3" />
            {fragment.signersCount}
          </span>
        </td>
        <td>
          <span className="text-accent-yellow font-medium">
            {formatSatoshis(fragment.feePool)}
          </span>
        </td>
        <td className="text-text-secondary">{fragment.feeBips} bips</td>
      </tr>
      {expanded && fragment.signers.length > 0 && (
        <tr>
          <td colSpan={7} className="bg-background-tertiary p-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white mb-3">Signers ({fragment.signers.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary text-left">
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Fee</th>
                      <th className="pb-2 font-medium">BTC Public Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fragment.signers.map((signer, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="py-2">
                          <Link
                            href={`/accounts/${signer.signerAddress}`}
                            className="font-mono text-xs text-primary-light hover:text-primary"
                          >
                            {signer.signerAddress.substring(0, 24)}...
                          </Link>
                        </td>
                        <td className="py-2">
                          {signer.status ? (
                            <span className="text-accent-green text-xs">Active</span>
                          ) : (
                            <span className="text-accent-red text-xs">Inactive</span>
                          )}
                        </td>
                        <td className="py-2 text-text-secondary text-xs">
                          {formatSatoshis(signer.applicationFee)}
                        </td>
                        <td className="py-2">
                          <span className="font-mono text-xs text-text-secondary">
                            {signer.btcPubKey.substring(0, 30)}...
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function FragmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['fragments-live'],
    queryFn: getFragmentsLive,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Puzzle className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Fragments</h1>
          <p className="text-text-secondary text-sm">
            Multi-signature fragments for reserve management
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : (
        <>
          <div className="card p-4 mb-4">
            <span className="text-text-secondary">Total Fragments: </span>
            <span className="text-white font-medium">{data?.total || 0}</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Judge Address</th>
                  <th>Threshold</th>
                  <th>Signers</th>
                  <th>Fee Pool</th>
                  <th>Fee Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((fragment) => (
                  <FragmentRow key={fragment.id} fragment={fragment} />
                ))}
              </tbody>
            </table>
          </div>

          {(!data?.data || data.data.length === 0) && (
            <div className="text-center py-12 text-text-secondary">
              No fragments found
            </div>
          )}
        </>
      )}
    </div>
  );
}
