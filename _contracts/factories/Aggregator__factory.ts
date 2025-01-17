/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Aggregator, AggregatorInterface } from "../Aggregator";

const _abi = [
  {
    inputs: [],
    name: "ensRegistry",
    outputs: [
      {
        internalType: "contract ENSRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Governance",
        name: "governance",
        type: "address",
      },
    ],
    name: "getAllProposals",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "proposer",
            type: "address",
          },
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "forVotes",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "againstVotes",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "extended",
            type: "bool",
          },
          {
            internalType: "enum Governance.ProposalState",
            name: "state",
            type: "uint8",
          },
        ],
        internalType: "struct GovernanceAggregator.Proposal[]",
        name: "proposals",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Governance",
        name: "governance",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "accs",
        type: "address[]",
      },
    ],
    name: "getGovernanceBalances",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Governance",
        name: "governance",
        type: "address",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getUserData",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "latestProposalId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "latestProposalIdState",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timelock",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "relayerRegistry",
    outputs: [
      {
        internalType: "contract RelayerRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "_relayers",
        type: "bytes32[]",
      },
      {
        internalType: "string[]",
        name: "_subdomains",
        type: "string[]",
      },
    ],
    name: "relayersData",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isRegistered",
            type: "bool",
          },
          {
            internalType: "string[20]",
            name: "records",
            type: "string[20]",
          },
        ],
        internalType: "struct Relayer[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class Aggregator__factory {
  static readonly abi = _abi;
  static createInterface(): AggregatorInterface {
    return new utils.Interface(_abi) as AggregatorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Aggregator {
    return new Contract(address, _abi, signerOrProvider) as Aggregator;
  }
}
