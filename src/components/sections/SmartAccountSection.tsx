import { BiconomyStatus } from '../BiconomyStatus';
import { TransactionQueue } from '../TransactionQueue';
import { SessionKeyManager } from '../SessionKeyManager';
import { Zap } from 'lucide-react';

export const SmartAccountSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Zap className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Smart Account Management</h1>
          <p className="text-emerald-600 mt-1">
            Manage your Biconomy Smart Account with gasless transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BiconomyStatus />

        <TransactionQueue />

        <SessionKeyManager />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Smart Accounts</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Gasless Transactions</h4>
              <p>
                Your transactions are sponsored, meaning you don't need to worry about gas fees.
                The app covers the cost of interacting with the blockchain.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">Transaction Batching</h4>
              <p>
                Queue multiple transactions and execute them all at once in a single operation.
                This saves time and makes complex workflows more efficient.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">Session Keys</h4>
              <p>
                Create temporary keys that can automatically sign transactions on your behalf
                within defined permissions. Perfect for recurring actions without repeated approvals.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">Account Abstraction</h4>
              <p>
                Your smart account is a smart contract that provides enhanced security and
                features beyond traditional blockchain wallets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
