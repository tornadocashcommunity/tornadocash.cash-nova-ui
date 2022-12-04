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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface FeeManagerInterface extends ethers.utils.Interface {
  functions: {
    "FOREIGN_TO_HOME_FEE()": FunctionFragment;
    "HOME_TO_FOREIGN_FEE()": FunctionFragment;
    "calculateFee(bytes32,address,uint256)": FunctionFragment;
    "getFee(bytes32,address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "FOREIGN_TO_HOME_FEE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "HOME_TO_FOREIGN_FEE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "calculateFee",
    values: [BytesLike, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getFee",
    values: [BytesLike, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "FOREIGN_TO_HOME_FEE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "HOME_TO_FOREIGN_FEE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "calculateFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getFee", data: BytesLike): Result;

  events: {};
}

export class FeeManager extends BaseContract {
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

  interface: FeeManagerInterface;

  functions: {
    FOREIGN_TO_HOME_FEE(overrides?: CallOverrides): Promise<[string]>;

    HOME_TO_FOREIGN_FEE(overrides?: CallOverrides): Promise<[string]>;

    calculateFee(
      _feeType: BytesLike,
      _token: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getFee(
      _feeType: BytesLike,
      _token: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  FOREIGN_TO_HOME_FEE(overrides?: CallOverrides): Promise<string>;

  HOME_TO_FOREIGN_FEE(overrides?: CallOverrides): Promise<string>;

  calculateFee(
    _feeType: BytesLike,
    _token: string,
    _value: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getFee(
    _feeType: BytesLike,
    _token: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    FOREIGN_TO_HOME_FEE(overrides?: CallOverrides): Promise<string>;

    HOME_TO_FOREIGN_FEE(overrides?: CallOverrides): Promise<string>;

    calculateFee(
      _feeType: BytesLike,
      _token: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFee(
      _feeType: BytesLike,
      _token: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    FOREIGN_TO_HOME_FEE(overrides?: CallOverrides): Promise<BigNumber>;

    HOME_TO_FOREIGN_FEE(overrides?: CallOverrides): Promise<BigNumber>;

    calculateFee(
      _feeType: BytesLike,
      _token: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFee(
      _feeType: BytesLike,
      _token: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    FOREIGN_TO_HOME_FEE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    HOME_TO_FOREIGN_FEE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    calculateFee(
      _feeType: BytesLike,
      _token: string,
      _value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getFee(
      _feeType: BytesLike,
      _token: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
