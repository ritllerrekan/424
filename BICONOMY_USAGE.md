# Biconomy Account Abstraction Integration

This document describes how to use the Biconomy Account Abstraction features integrated into the FoodTrace application.

## Features

### 1. Smart Account Creation
Every user automatically gets a Biconomy Smart Account when they log in with Web3Auth. The smart account is derived from their EOA (Externally Owned Account) wallet.

### 2. Gasless Transactions
All transactions are sponsored by the application's paymaster, meaning users don't need to hold MATIC tokens to interact with the blockchain.

### 3. Transaction Batching
Multiple transactions can be queued and executed together in a single operation, saving time and improving efficiency.

### 4. Session Keys
Users can create temporary session keys that automatically sign transactions within defined permissions, enabling seamless user experiences.

## Usage Examples

### Basic Transaction

```typescript
import { useBiconomy } from '../contexts/BiconomyContext';

function MyComponent() {
  const { sendTransaction, loading } = useBiconomy();

  const handleTransaction = async () => {
    try {
      const contractAddress = '0x...';
      const data = '0x...'; // encoded function call
      const txHash = await sendTransaction(contractAddress, data);
      console.log('Transaction hash:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={handleTransaction} disabled={loading}>
      Send Transaction
    </button>
  );
}
```

### Batch Transactions

```typescript
import { useBiconomy } from '../contexts/BiconomyContext';

function BatchComponent() {
  const { sendBatchTransactions } = useBiconomy();

  const handleBatch = async () => {
    const transactions = [
      { to: '0x...', data: '0x...' },
      { to: '0x...', data: '0x...' },
      { to: '0x...', data: '0x...' }
    ];

    const txHash = await sendBatchTransactions(transactions);
    console.log('Batch transaction hash:', txHash);
  };

  return <button onClick={handleBatch}>Execute Batch</button>;
}
```

### Transaction Queue

```typescript
import { useBiconomy } from '../contexts/BiconomyContext';

function QueueComponent() {
  const { addToQueue, processQueue, transactionQueue } = useBiconomy();

  const addTransaction = () => {
    addToQueue({
      to: '0x...',
      data: '0x...',
      description: 'Create batch'
    });
  };

  const executeQueue = async () => {
    await processQueue();
  };

  return (
    <div>
      <button onClick={addTransaction}>Add to Queue</button>
      <button onClick={executeQueue}>Process Queue ({transactionQueue.length})</button>
    </div>
  );
}
```

### Session Keys

```typescript
import { SessionKeyModule, createUniversalPermission } from '../lib/sessionKey';
import { useBiconomy } from '../contexts/BiconomyContext';

function SessionKeyComponent() {
  const { smartAccount } = useBiconomy();

  const createSessionKey = async () => {
    const sessionModule = new SessionKeyModule(smartAccount);

    // Create a session key valid for 1 hour with max 0.01 MATIC per transaction
    const permissions = [createUniversalPermission('0.01')];
    const { sessionKey, config } = await sessionModule.createSessionKey(
      3600, // 1 hour
      permissions
    );

    // Enable the session key on-chain
    await sessionModule.enableSessionKey(config);

    console.log('Session key created:', sessionKey.address);
  };

  return <button onClick={createSessionKey}>Create Session Key</button>;
}
```

### Encoding Contract Calls

```typescript
import { ethers } from 'ethers';
import { encodeContractCall } from '../lib/biconomy';

// Example: Encoding a function call
const contractABI = [
  'function createBatch(string memory batchId, uint256 quantity) public'
];

const contractInterface = new ethers.Interface(contractABI);
const encodedData = encodeContractCall(
  contractInterface,
  'createBatch',
  ['BATCH-001', 100]
);

// Now use this encoded data in a transaction
await sendTransaction(contractAddress, encodedData);
```

## Smart Account Management

Users can view and manage their smart account through the "Smart Account" section in the dashboard, which includes:

- **Smart Account Status**: View smart account address, deployment status, and balance
- **Transaction Queue**: Queue and batch process multiple transactions
- **Session Key Manager**: Create, view, and revoke session keys

## Configuration

The Biconomy configuration is set up in `BiconomyContext.tsx`:

- **Chain ID**: 80002 (Polygon Amoy Testnet)
- **Bundler URL**: Biconomy bundler endpoint
- **Paymaster URL**: Biconomy paymaster for gas sponsorship

## Important Notes

1. **Gas Sponsorship**: All transactions are sponsored by the paymaster. Users don't need MATIC.

2. **Smart Account Deployment**: The smart account is deployed on the first transaction. Until then, it exists as a counterfactual address.

3. **Session Keys**: Session keys are stored in localStorage and automatically expire after their validity period.

4. **Transaction Queue**: Queued transactions are executed together as a batch when you click "Process Queue".

5. **Error Handling**: Always wrap transaction calls in try-catch blocks to handle potential failures gracefully.

## Architecture

```
Web3Auth (EOA Wallet)
       ↓
BiconomyContext
       ↓
Smart Account (Contract Wallet)
       ↓
[Gasless Transactions] → [Bundler] → [Paymaster] → [Blockchain]
```

## Security Considerations

1. **Session Keys**: Only create session keys with the minimum required permissions and shortest reasonable duration.

2. **Transaction Validation**: Always validate transaction parameters before queuing or executing.

3. **Permission Checks**: Session keys enforce permissions on-chain. Invalid transactions will be rejected.

4. **Rate Limiting**: Be mindful of paymaster rate limits when executing multiple transactions.

## Support

For issues or questions about Biconomy integration:
- Check Biconomy documentation: https://docs.biconomy.io/
- Review transaction status on Polygon Amoy explorer: https://amoy.polygonscan.com/
