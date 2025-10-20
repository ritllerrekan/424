import { ethers } from 'ethers';
import { FOOD_SUPPLY_CHAIN_ABI } from './abi';

export const CONTRACT_ADDRESS = '0xYourContractAddressHere';

export function getContractInstance(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, FOOD_SUPPLY_CHAIN_ABI, signerOrProvider);
}

export function getContractInterface() {
  return new ethers.Interface(FOOD_SUPPLY_CHAIN_ABI);
}
