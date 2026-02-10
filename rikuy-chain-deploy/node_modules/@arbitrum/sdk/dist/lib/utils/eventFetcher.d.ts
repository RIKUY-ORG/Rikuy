import { Provider, BlockTag } from '@ethersproject/abstract-provider';
import { Contract, Event } from '@ethersproject/contracts';
import { TypedEvent, TypedEventFilter } from '../abi/common';
import { EventArgs, TypeChainContractFactory } from '../dataEntities/event';
export type FetchedEvent<TEvent extends Event> = {
    event: EventArgs<TEvent>;
    topic: string;
    name: string;
    blockNumber: number;
    blockHash: string;
    transactionHash: string;
    address: string;
    topics: string[];
    data: string;
};
type TEventOf<T> = T extends TypedEventFilter<infer TEvent> ? TEvent : never;
/**
 * Fetches and parses blockchain logs
 */
export declare class EventFetcher {
    readonly provider: Provider;
    constructor(provider: Provider);
    /**
     * Fetch logs and parse logs
     * @param contractFactory A contract factory for generating a contract of type TContract at the addr
     * @param topicGenerator Generator function for creating
     * @param filter Block and address filter parameters
     * @returns
     */
    getEvents<TContract extends Contract, TEventFilter extends TypedEventFilter<TypedEvent>>(contractFactory: TypeChainContractFactory<TContract>, topicGenerator: (t: TContract) => TEventFilter, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
        address?: string;
    }): Promise<FetchedEvent<TEventOf<TEventFilter>>[]>;
}
export {};
