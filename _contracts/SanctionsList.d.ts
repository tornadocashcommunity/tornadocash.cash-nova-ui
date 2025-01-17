/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface SanctionsListInterface extends ethers.utils.Interface {
  functions: {
    "addToSanctionsList(address[])": FunctionFragment;
    "isSanctioned(address)": FunctionFragment;
    "isSanctionedVerbose(address)": FunctionFragment;
    "name()": FunctionFragment;
    "owner()": FunctionFragment;
    "removeFromSanctionsList(address[])": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addToSanctionsList",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "isSanctioned",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "isSanctionedVerbose",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "removeFromSanctionsList",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "addToSanctionsList",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isSanctioned",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isSanctionedVerbose",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeFromSanctionsList",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "NonSanctionedAddress(address)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "SanctionedAddress(address)": EventFragment;
    "SanctionedAddressesAdded(address[])": EventFragment;
    "SanctionedAddressesRemoved(address[])": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "NonSanctionedAddress"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SanctionedAddress"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SanctionedAddressesAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SanctionedAddressesRemoved"): EventFragment;
}

export type NonSanctionedAddressEvent = TypedEvent<[string] & { addr: string }>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { previousOwner: string; newOwner: string }
>;

export type SanctionedAddressEvent = TypedEvent<[string] & { addr: string }>;

export type SanctionedAddressesAddedEvent = TypedEvent<
  [string[]] & { addrs: string[] }
>;

export type SanctionedAddressesRemovedEvent = TypedEvent<
  [string[]] & { addrs: string[] }
>;

export class SanctionsList extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: SanctionsListInterface;

  functions: {
    addToSanctionsList(
      newSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    isSanctioned(addr: string, overrides?: CallOverrides): Promise<[boolean]>;

    isSanctionedVerbose(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    name(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    removeFromSanctionsList(
      removeSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  addToSanctionsList(
    newSanctions: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  isSanctioned(addr: string, overrides?: CallOverrides): Promise<boolean>;

  isSanctionedVerbose(
    addr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  name(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  removeFromSanctionsList(
    removeSanctions: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addToSanctionsList(
      newSanctions: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    isSanctioned(addr: string, overrides?: CallOverrides): Promise<boolean>;

    isSanctionedVerbose(
      addr: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    name(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    removeFromSanctionsList(
      removeSanctions: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "NonSanctionedAddress(address)"(
      addr?: string | null
    ): TypedEventFilter<[string], { addr: string }>;

    NonSanctionedAddress(
      addr?: string | null
    ): TypedEventFilter<[string], { addr: string }>;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    "SanctionedAddress(address)"(
      addr?: string | null
    ): TypedEventFilter<[string], { addr: string }>;

    SanctionedAddress(
      addr?: string | null
    ): TypedEventFilter<[string], { addr: string }>;

    "SanctionedAddressesAdded(address[])"(
      addrs?: null
    ): TypedEventFilter<[string[]], { addrs: string[] }>;

    SanctionedAddressesAdded(
      addrs?: null
    ): TypedEventFilter<[string[]], { addrs: string[] }>;

    "SanctionedAddressesRemoved(address[])"(
      addrs?: null
    ): TypedEventFilter<[string[]], { addrs: string[] }>;

    SanctionedAddressesRemoved(
      addrs?: null
    ): TypedEventFilter<[string[]], { addrs: string[] }>;
  };

  estimateGas: {
    addToSanctionsList(
      newSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    isSanctioned(addr: string, overrides?: CallOverrides): Promise<BigNumber>;

    isSanctionedVerbose(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    removeFromSanctionsList(
      removeSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addToSanctionsList(
      newSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    isSanctioned(
      addr: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isSanctionedVerbose(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeFromSanctionsList(
      removeSanctions: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
