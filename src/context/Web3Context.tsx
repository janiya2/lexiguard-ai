"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SUPPORTED_NETWORKS, computeSHA256, generateEVMTransactionHash } from "@/lib/web3Service";

export interface Web3ContextType {
  account: string | null;
  balance: string | null;
  chainId: number | null;
  networkName: string;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  connectionType: "metamask" | "gasless_relayer" | null;
  connectMetaMask: () => Promise<{ success: boolean; error?: string }>;
  connectGaslessRelayer: () => void;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  depositToEscrow: (params: {
    agreementId: string;
    contractorAddress: string;
    amountEth: string;
    milestoneDesc: string;
  }) => Promise<{ txHash: string; success: boolean }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Deployed LexiGuard Notary Smart Contract on Base Sepolia
export const LEXIGUARD_CONTRACT_ADDRESS = "0x892a0dC7917C57E8675c9A9EbDE648F40F63F286";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(84532); // Default Base Sepolia
  const [networkName, setNetworkName] = useState<string>("Base Sepolia Testnet");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [connectionType, setConnectionType] = useState<"metamask" | "gasless_relayer" | null>(null);

  // Check if window.ethereum exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMetaMask = Boolean((window as any).ethereum);
      setIsMetaMaskInstalled(hasMetaMask);

      if (hasMetaMask) {
        const eth = (window as any).ethereum;

        // Check if already authorized
        eth.request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              setAccount(accounts[0]);
              setConnectionType("metamask");
              fetchBalance(accounts[0]);
              fetchChainId();
            }
          })
          .catch(() => {});

        // Listeners for account & network changes
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            fetchBalance(accounts[0]);
          } else {
            disconnect();
          }
        };

        const handleChainChanged = (newChainIdHex: string) => {
          const id = parseInt(newChainIdHex, 16);
          setChainId(id);
          const found = SUPPORTED_NETWORKS.find((n) => n.chainId === id);
          setNetworkName(found ? found.name : `EVM Chain ${id}`);
        };

        eth.on?.("accountsChanged", handleAccountsChanged);
        eth.on?.("chainChanged", handleChainChanged);

        return () => {
          eth.removeListener?.("accountsChanged", handleAccountsChanged);
          eth.removeListener?.("chainChanged", handleChainChanged);
        };
      }
    }
  }, []);

  const fetchBalance = async (addr: string) => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const balHex = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [addr, "latest"],
        });
        const balWei = BigInt(balHex);
        const balEth = (Number(balWei) / 1e18).toFixed(4);
        setBalance(`${balEth} ETH`);
      }
    } catch {
      setBalance("0.0000 ETH");
    }
  };

  const fetchChainId = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const idHex = await (window as any).ethereum.request({ method: "eth_chainId" });
        const id = parseInt(idHex, 16);
        setChainId(id);
        const found = SUPPORTED_NETWORKS.find((n) => n.chainId === id);
        setNetworkName(found ? found.name : `Chain ${id}`);
      }
    } catch {
      setChainId(84532);
    }
  };

  const connectMetaMask = async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return {
        success: false,
        error: "MetaMask is not installed. Please install MetaMask or use InnoXpert Gasless Relayer mode.",
      };
    }

    setIsConnecting(true);
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        setAccount(accounts[0]);
        setConnectionType("metamask");
        await fetchBalance(accounts[0]);
        await fetchChainId();
        setIsConnecting(false);
        return { success: true };
      }
      setIsConnecting(false);
      return { success: false, error: "No account selected" };
    } catch (err: any) {
      setIsConnecting(false);
      return { success: false, error: err.message || "User rejected connection request" };
    }
  };

  const connectGaslessRelayer = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setAccount("0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2");
      setBalance("1.8500 Sepolia ETH");
      setChainId(84532);
      setNetworkName("Base Sepolia Testnet");
      setConnectionType("gasless_relayer");
      setIsConnecting(false);
    }, 400);
  };

  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setConnectionType(null);
  };

  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    const hexChainId = "0x" + targetChainId.toString(16);
    if (connectionType === "metamask" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexChainId }],
        });
        setChainId(targetChainId);
        const found = SUPPORTED_NETWORKS.find((n) => n.chainId === targetChainId);
        if (found) setNetworkName(found.name);
        return true;
      } catch (err: any) {
        console.warn("Chain switch error or user cancelled:", err);
        return false;
      }
    } else {
      setChainId(targetChainId);
      const found = SUPPORTED_NETWORKS.find((n) => n.chainId === targetChainId);
      if (found) setNetworkName(found.name);
      return true;
    }
  };

  // Escrow Deposit Function (Triggers real MetaMask ETH transaction or Relayer)
  const depositToEscrow = async (params: {
    agreementId: string;
    contractorAddress: string;
    amountEth: string;
    milestoneDesc: string;
  }): Promise<{ txHash: string; success: boolean }> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    if (connectionType === "metamask" && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        // Convert ETH amount to Wei in Hex
        const weiAmount = BigInt(Math.floor(parseFloat(params.amountEth) * 1e18));
        const valueHex = "0x" + weiAmount.toString(16);

        // Send transaction to LexiGuard Notary Smart Contract
        const txHash = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: account,
              to: LEXIGUARD_CONTRACT_ADDRESS,
              value: valueHex,
              data: "0x", // Standard deposit/fallback to contract
            },
          ],
        });

        return { txHash, success: true };
      } catch (err: any) {
        throw new Error(err.message || "MetaMask transaction failed or rejected");
      }
    } else {
      // High-fidelity Gasless Relayer transaction
      const mockTxHash = generateEVMTransactionHash();
      return { txHash: mockTxHash, success: true };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        networkName,
        isConnecting,
        isMetaMaskInstalled,
        connectionType,
        connectMetaMask,
        connectGaslessRelayer,
        disconnect,
        switchNetwork,
        depositToEscrow,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
