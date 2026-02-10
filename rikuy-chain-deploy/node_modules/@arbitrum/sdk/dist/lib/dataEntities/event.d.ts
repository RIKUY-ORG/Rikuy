import { TypedEvent, TypedEventFilter } from '../abi/common';
import { Contract } from 'ethers';
import { Provider, Log } from '@ethersproject/abstract-provider';
import { Interface } from 'ethers/lib/utils';
/**
 * The type of the event arguments.
 * Gets the second generic arg
 */
export type EventArgs<T> = T extends TypedEvent<infer _, infer TObj> ? TObj : never;
/**
 * The event type of a filter
 * Gets the first generic arg
 */
export type EventFromFilter<TFilter> = TFilter extends TypedEventFilter<infer TEvent> ? TEvent : never;
/**
 * All filter keys for the provided contract
 */
type FilterName<TContract extends Contract> = keyof TContract['filters'] & string;
/**
 * The event type of a given filter
 */
type EventType<TContract extends Contract, TFilterName extends keyof TContract['filters']> = EventArgs<EventFromFilter<ReturnType<TContract['filters'][TFilterName]>>>;
/**
 * Typechain contract factories have additional properties
 */
export type TypeChainContractFactory<TContract extends Contract> = {
    connect(address: string, provider: Provider): TContract;
    createInterface(): Interface;
};
/**
 * Parse a log that matches a given filter name.
 * @param contractFactory
 * @param log The log to parse
 * @param filterName
 * @returns Null if filter name topic does not match log topic
 */
export declare const parseTypedLog: <TContract extends Contract, TFilterName extends FilterName<TContract>>(contractFactory: TypeChainContractFactory<TContract>, log: Log, filterName: TFilterName) => EventType<TContract, TFilterName> | null;
/**
 * Parses an array of logs.
 * Filters out any logs whose topic does not match provided the filter name topic.
 * @param contractFactory
 * @param logs The logs to parse
 * @param filterName
 * @returns
 */
export declare const parseTypedLogs: <TContract extends Contract, TFilterName extends FilterName<TContract>>(contractFactory: TypeChainContractFactory<TContract>, logs: Log[], filterName: TFilterName) => EventType<TContract, TFilterName>[];
export {};
