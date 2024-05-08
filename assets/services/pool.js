export const poolAbi = [
  {
    inputs: [
      {
        internalType: "contract IVerifier",
        name: "_verifier2",
        type: "address",
      },
      {
        internalType: "contract IVerifier",
        name: "_verifier16",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "_levels",
        type: "uint32",
      },
      {
        internalType: "address",
        name: "_hasher",
        type: "address",
      },
      {
        internalType: "contract IERC6777",
        name: "_token",
        type: "address",
      },
      {
        internalType: "address",
        name: "_omniBridge",
        type: "address",
      },
      {
        internalType: "address",
        name: "_l1Unwrapper",
        type: "address",
      },
      {
        internalType: "address",
        name: "_governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_l1ChainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_multisig",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "commitment",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "encryptedOutput",
        type: "bytes",
      },
    ],
    name: "NewCommitment",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "nullifier",
        type: "bytes32",
      },
    ],
    name: "NewNullifier",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "key",
        type: "bytes",
      },
    ],
    name: "PublicKey",
    type: "event",
  },
  {
    inputs: [],
    name: "FIELD_SIZE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_EXT_AMOUNT",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_FEE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_EXT_AMOUNT_LIMIT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ROOT_HISTORY_SIZE",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ZERO_VALUE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ambBridge",
    outputs: [
      {
        internalType: "contract IAMB",
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
        internalType: "int256",
        name: "_extAmount",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "_fee",
        type: "uint256",
      },
    ],
    name: "calculatePublicAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_minimalWithdrawalAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maximumDepositAmount",
        type: "uint256",
      },
    ],
    name: "configureLimits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "currentRootIndex",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "filledSubtrees",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLastRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_left",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_right",
        type: "bytes32",
      },
    ],
    name: "hashLeftRight",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "hasher",
    outputs: [
      {
        internalType: "contract IHasher",
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
        internalType: "uint256",
        name: "_minimalWithdrawalAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maximumDepositAmount",
        type: "uint256",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isCalledByOwner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_root",
        type: "bytes32",
      },
    ],
    name: "isKnownRoot",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_nullifierHash",
        type: "bytes32",
      },
    ],
    name: "isSpent",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "l1Unwrapper",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "levels",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maximumDepositAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimalWithdrawalAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "multisig",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextIndex",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "nullifierHashes",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "omniBridge",
    outputs: [
      {
        internalType: "address",
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
        internalType: "contract IERC6777",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "onTokenBridged",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes",
            name: "proof",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "root",
            type: "bytes32",
          },
          {
            internalType: "bytes32[]",
            name: "inputNullifiers",
            type: "bytes32[]",
          },
          {
            internalType: "bytes32[2]",
            name: "outputCommitments",
            type: "bytes32[2]",
          },
          {
            internalType: "uint256",
            name: "publicAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "extDataHash",
            type: "bytes32",
          },
        ],
        internalType: "struct TornadoPool.Proof",
        name: "_args",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "int256",
            name: "extAmount",
            type: "int256",
          },
          {
            internalType: "address",
            name: "relayer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput1",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput2",
            type: "bytes",
          },
          {
            internalType: "bool",
            name: "isL1Withdrawal",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "l1Fee",
            type: "uint256",
          },
        ],
        internalType: "struct TornadoPool.ExtData",
        name: "_extData",
        type: "tuple",
      },
    ],
    name: "onTransact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ownerChainId",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "publicKey",
            type: "bytes",
          },
        ],
        internalType: "struct TornadoPool.Account",
        name: "_account",
        type: "tuple",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "publicKey",
            type: "bytes",
          },
        ],
        internalType: "struct TornadoPool.Account",
        name: "_account",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "bytes",
            name: "proof",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "root",
            type: "bytes32",
          },
          {
            internalType: "bytes32[]",
            name: "inputNullifiers",
            type: "bytes32[]",
          },
          {
            internalType: "bytes32[2]",
            name: "outputCommitments",
            type: "bytes32[2]",
          },
          {
            internalType: "uint256",
            name: "publicAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "extDataHash",
            type: "bytes32",
          },
        ],
        internalType: "struct TornadoPool.Proof",
        name: "_proofArgs",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "int256",
            name: "extAmount",
            type: "int256",
          },
          {
            internalType: "address",
            name: "relayer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput1",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput2",
            type: "bytes",
          },
          {
            internalType: "bool",
            name: "isL1Withdrawal",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "l1Fee",
            type: "uint256",
          },
        ],
        internalType: "struct TornadoPool.ExtData",
        name: "_extData",
        type: "tuple",
      },
    ],
    name: "registerAndTransact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC6777",
        name: "_token",
        type: "address",
      },
      {
        internalType: "address payable",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_balance",
        type: "uint256",
      },
    ],
    name: "rescueTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "roots",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC6777",
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
        components: [
          {
            internalType: "bytes",
            name: "proof",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "root",
            type: "bytes32",
          },
          {
            internalType: "bytes32[]",
            name: "inputNullifiers",
            type: "bytes32[]",
          },
          {
            internalType: "bytes32[2]",
            name: "outputCommitments",
            type: "bytes32[2]",
          },
          {
            internalType: "uint256",
            name: "publicAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "extDataHash",
            type: "bytes32",
          },
        ],
        internalType: "struct TornadoPool.Proof",
        name: "_args",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "int256",
            name: "extAmount",
            type: "int256",
          },
          {
            internalType: "address",
            name: "relayer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fee",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput1",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "encryptedOutput2",
            type: "bytes",
          },
          {
            internalType: "bool",
            name: "isL1Withdrawal",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "l1Fee",
            type: "uint256",
          },
        ],
        internalType: "struct TornadoPool.ExtData",
        name: "_extData",
        type: "tuple",
      },
    ],
    name: "transact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier16",
    outputs: [
      {
        internalType: "contract IVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier2",
    outputs: [
      {
        internalType: "contract IVerifier",
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
        components: [
          {
            internalType: "bytes",
            name: "proof",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "root",
            type: "bytes32",
          },
          {
            internalType: "bytes32[]",
            name: "inputNullifiers",
            type: "bytes32[]",
          },
          {
            internalType: "bytes32[2]",
            name: "outputCommitments",
            type: "bytes32[2]",
          },
          {
            internalType: "uint256",
            name: "publicAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "extDataHash",
            type: "bytes32",
          },
        ],
        internalType: "struct TornadoPool.Proof",
        name: "_args",
        type: "tuple",
      },
    ],
    name: "verifyProof",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "zeros",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
]