import { BiconomySmartAccountV2 } from '@biconomy/account';
import { ethers } from 'ethers';

export interface SessionKeyConfig {
  sessionPublicKey: string;
  validUntil: number;
  validAfter: number;
  permissions: SessionPermission[];
}

export interface SessionPermission {
  target: string;
  selector: string;
  maxValue?: string;
}

export class SessionKeyModule {
  private smartAccount: BiconomySmartAccountV2;
  private sessionKeys: Map<string, SessionKeyConfig>;

  constructor(smartAccount: BiconomySmartAccountV2) {
    this.smartAccount = smartAccount;
    this.sessionKeys = new Map();
    this.loadSessionKeys();
  }

  async createSessionKey(
    duration: number,
    permissions: SessionPermission[]
  ): Promise<{ sessionKey: ethers.Wallet; config: SessionKeyConfig }> {
    try {
      const sessionKey = ethers.Wallet.createRandom();
      const now = Math.floor(Date.now() / 1000);

      const config: SessionKeyConfig = {
        sessionPublicKey: sessionKey.address,
        validUntil: now + duration,
        validAfter: now,
        permissions,
      };

      this.sessionKeys.set(sessionKey.address, config);
      this.saveSessionKeys();

      console.log('Session key created:', sessionKey.address);
      console.log('Valid until:', new Date(config.validUntil * 1000).toISOString());

      return { sessionKey, config };
    } catch (error) {
      console.error('Failed to create session key:', error);
      throw error;
    }
  }

  async enableSessionKey(config: SessionKeyConfig): Promise<string> {
    try {
      const moduleAddress = '0x000000D50C68705bd6897B2d17c7de32FB519fDA';

      const enableData = this.encodeEnableSessionKeyData(config);

      const tx = {
        to: moduleAddress,
        data: enableData,
        value: ethers.parseEther('0'),
      };

      const userOpResponse = await this.smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: 'SPONSORED' },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log('Session key enabled:', transactionHash);

      return transactionHash;
    } catch (error) {
      console.error('Failed to enable session key:', error);
      throw error;
    }
  }

  async executeWithSessionKey(
    sessionKey: ethers.Wallet,
    transaction: {
      to: string;
      data: string;
      value?: string;
    }
  ): Promise<string> {
    try {
      const config = this.sessionKeys.get(sessionKey.address);
      if (!config) {
        throw new Error('Session key not found');
      }

      const now = Math.floor(Date.now() / 1000);
      if (now > config.validUntil || now < config.validAfter) {
        throw new Error('Session key expired or not yet valid');
      }

      const hasPermission = this.checkPermission(config, transaction);
      if (!hasPermission) {
        throw new Error('Transaction not permitted by session key');
      }

      const tx = {
        to: transaction.to,
        data: transaction.data,
        value: ethers.parseEther(transaction.value || '0'),
      };

      const userOpResponse = await this.smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: 'SPONSORED' },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log('Transaction executed with session key:', transactionHash);

      return transactionHash;
    } catch (error) {
      console.error('Failed to execute with session key:', error);
      throw error;
    }
  }

  revokeSessionKey(sessionKeyAddress: string): void {
    this.sessionKeys.delete(sessionKeyAddress);
    this.saveSessionKeys();
    console.log('Session key revoked:', sessionKeyAddress);
  }

  getActiveSessionKeys(): SessionKeyConfig[] {
    const now = Math.floor(Date.now() / 1000);
    return Array.from(this.sessionKeys.values()).filter(
      config => now >= config.validAfter && now <= config.validUntil
    );
  }

  isSessionKeyValid(sessionKeyAddress: string): boolean {
    const config = this.sessionKeys.get(sessionKeyAddress);
    if (!config) return false;

    const now = Math.floor(Date.now() / 1000);
    return now >= config.validAfter && now <= config.validUntil;
  }

  private checkPermission(
    config: SessionKeyConfig,
    transaction: { to: string; data: string; value?: string }
  ): boolean {
    const selector = transaction.data.slice(0, 10);

    return config.permissions.some(permission => {
      const targetMatch =
        permission.target.toLowerCase() === transaction.to.toLowerCase() ||
        permission.target === '0x0000000000000000000000000000000000000000';

      const selectorMatch =
        permission.selector === selector ||
        permission.selector === '0x00000000';

      let valueMatch = true;
      if (permission.maxValue && transaction.value) {
        const txValue = ethers.parseEther(transaction.value);
        const maxValue = ethers.parseEther(permission.maxValue);
        valueMatch = txValue <= maxValue;
      }

      return targetMatch && selectorMatch && valueMatch;
    });
  }

  private encodeEnableSessionKeyData(config: SessionKeyConfig): string {
    const iface = new ethers.Interface([
      'function enableSessionKey(address sessionKey, uint48 validUntil, uint48 validAfter, bytes calldata sessionKeyData)',
    ]);

    const sessionKeyData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address target, bytes4 selector, uint256 maxValue)[]'],
      [
        config.permissions.map(p => ({
          target: p.target,
          selector: p.selector,
          maxValue: p.maxValue ? ethers.parseEther(p.maxValue) : 0n,
        })),
      ]
    );

    return iface.encodeFunctionData('enableSessionKey', [
      config.sessionPublicKey,
      config.validUntil,
      config.validAfter,
      sessionKeyData,
    ]);
  }

  private saveSessionKeys(): void {
    try {
      const data = Array.from(this.sessionKeys.entries());
      localStorage.setItem('biconomy_session_keys', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save session keys:', error);
    }
  }

  private loadSessionKeys(): void {
    try {
      const data = localStorage.getItem('biconomy_session_keys');
      if (data) {
        const entries = JSON.parse(data);
        this.sessionKeys = new Map(entries);

        const now = Math.floor(Date.now() / 1000);
        for (const [key, config] of this.sessionKeys.entries()) {
          if (now > config.validUntil) {
            this.sessionKeys.delete(key);
          }
        }
        this.saveSessionKeys();
      }
    } catch (error) {
      console.error('Failed to load session keys:', error);
    }
  }
}

export function createSessionPermission(
  target: string,
  functionSignature: string,
  maxValue?: string
): SessionPermission {
  const selector = ethers.id(functionSignature).slice(0, 10);

  return {
    target,
    selector,
    maxValue,
  };
}

export function createUniversalPermission(maxValue?: string): SessionPermission {
  return {
    target: '0x0000000000000000000000000000000000000000',
    selector: '0x00000000',
    maxValue,
  };
}
