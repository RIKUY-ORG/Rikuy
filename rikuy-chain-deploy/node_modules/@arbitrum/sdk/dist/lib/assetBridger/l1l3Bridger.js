"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthL1L3Bridger = exports.Erc20L1L3Bridger = exports.TeleportationType = void 0;
const ethers_1 = require("ethers");
const IERC20__factory_1 = require("../abi/factories/IERC20__factory");
const L1GatewayRouter__factory_1 = require("../abi/factories/L1GatewayRouter__factory");
const IL2ForwarderFactory__factory_1 = require("../abi/factories/IL2ForwarderFactory__factory");
const L2GatewayToken__factory_1 = require("../abi/factories/L2GatewayToken__factory");
const IL1Teleporter__factory_1 = require("../abi/factories/IL1Teleporter__factory");
const address_1 = require("../dataEntities/address");
const errors_1 = require("../dataEntities/errors");
const networks_1 = require("../dataEntities/networks");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const ParentToChildMessage_1 = require("../message/ParentToChildMessage");
const ParentToChildMessageCreator_1 = require("../message/ParentToChildMessageCreator");
const ParentToChildMessageGasEstimator_1 = require("../message/ParentToChildMessageGasEstimator");
const ParentTransaction_1 = require("../message/ParentTransaction");
const erc20Bridger_1 = require("./erc20Bridger");
const Inbox__factory_1 = require("../abi/factories/Inbox__factory");
const utils_1 = require("ethers/lib/utils");
const ERC20__factory_1 = require("../abi/factories/ERC20__factory");
const IL2ForwarderPredictor__factory_1 = require("../abi/factories/IL2ForwarderPredictor__factory");
const IInbox__factory_1 = require("../abi/factories/IInbox__factory");
var TeleportationType;
(function (TeleportationType) {
    /**
     * Teleporting to an ETH fee L3
     */
    TeleportationType[TeleportationType["Standard"] = 0] = "Standard";
    /**
     * Teleporting the fee token to a custom fee L3
     */
    TeleportationType[TeleportationType["OnlyGasToken"] = 1] = "OnlyGasToken";
    /**
     * Teleporting a non-fee token to a custom fee L3
     */
    TeleportationType[TeleportationType["NonGasTokenToCustomGas"] = 2] = "NonGasTokenToCustomGas";
})(TeleportationType || (exports.TeleportationType = TeleportationType = {}));
/**
 * Base functionality for L1 to L3 bridging.
 */
class BaseL1L3Bridger {
    constructor(l3Network) {
        this.defaultGasPricePercentIncrease = ethers_1.BigNumber.from(500);
        this.defaultGasLimitPercentIncrease = ethers_1.BigNumber.from(100);
        const l2Network = (0, networks_1.getArbitrumNetworks)().find(network => network.chainId === l3Network.parentChainId);
        if (!l2Network) {
            throw new errors_1.ArbSdkError(`Unknown arbitrum network chain id: ${l3Network.parentChainId}`);
        }
        this.l1Network = { chainId: l2Network.parentChainId };
        this.l2Network = l2Network;
        this.l3Network = l3Network;
    }
    /**
     * Check the signer/provider matches the l1Network, throws if not
     * @param sop
     */
    async _checkL1Network(sop) {
        await signerOrProvider_1.SignerProviderUtils.checkNetworkMatches(sop, this.l1Network.chainId);
    }
    /**
     * Check the signer/provider matches the l2Network, throws if not
     * @param sop
     */
    async _checkL2Network(sop) {
        await signerOrProvider_1.SignerProviderUtils.checkNetworkMatches(sop, this.l2Network.chainId);
    }
    /**
     * Check the signer/provider matches the l3Network, throws if not
     * @param sop
     */
    async _checkL3Network(sop) {
        await signerOrProvider_1.SignerProviderUtils.checkNetworkMatches(sop, this.l3Network.chainId);
    }
    _percentIncrease(num, increase) {
        return num.add(num.mul(increase).div(100));
    }
    _getTxHashFromTxRef(txRef) {
        if ('txHash' in txRef) {
            return txRef.txHash;
        }
        else if ('tx' in txRef) {
            return txRef.tx.hash;
        }
        else {
            return txRef.txReceipt.transactionHash;
        }
    }
    async _getTxFromTxRef(txRef, provider) {
        if ('tx' in txRef) {
            return txRef.tx;
        }
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchContractCallWait(await provider.getTransaction(this._getTxHashFromTxRef(txRef)));
    }
    async _getTxReceiptFromTxRef(txRef, provider) {
        if ('txReceipt' in txRef) {
            return txRef.txReceipt;
        }
        return new ParentTransaction_1.ParentContractCallTransactionReceipt(await provider.getTransactionReceipt(this._getTxHashFromTxRef(txRef)));
    }
}
/**
 * Bridger for moving ERC20 tokens from L1 to L3
 */
class Erc20L1L3Bridger extends BaseL1L3Bridger {
    constructor(l3Network) {
        super(l3Network);
        /**
         * Default gas limit for L2ForwarderFactory.callForwarder of 1,000,000
         *
         * Measured Standard: 361746
         *
         * Measured OnlyGasToken: 220416
         *
         * Measured NonGasTokenToCustomGas: 373449
         */
        this.l2ForwarderFactoryDefaultGasLimit = ethers_1.BigNumber.from(1000000);
        this.skipL1GasTokenMagic = ethers_1.ethers.utils.getAddress(ethers_1.ethers.utils.hexDataSlice(ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes('SKIP_FEE_TOKEN')), 0, 20));
        this.l2Erc20Bridger = new erc20Bridger_1.Erc20Bridger(this.l2Network);
        this.l3Erc20Bridger = new erc20Bridger_1.Erc20Bridger(this.l3Network);
        if (!this.l2Network.teleporter) {
            throw new errors_1.ArbSdkError(`L2 network ${this.l2Network.name} does not have teleporter contracts`);
        }
        if (this.l3Network.nativeToken &&
            this.l3Network.nativeToken !== ethers_1.ethers.constants.AddressZero) {
            this.l2GasTokenAddress = this.l3Network.nativeToken;
        }
        this.teleporter = this.l2Network.teleporter;
    }
    /**
     * If the L3 network uses a custom gas token, return the address of that token on L1.
     * If the fee token is not available on L1, does not use 18 decimals on L1 and L2, or the L3 network uses ETH for fees, throw.
     */
    async getGasTokenOnL1(l1Provider, l2Provider) {
        // if the L3 network uses ETH for fees, early return zero
        if (!this.l2GasTokenAddress)
            throw new errors_1.ArbSdkError('L3 uses ETH for gas');
        // if we've already fetched the L1 fee token address, early return it
        if (this._l1FeeTokenAddress)
            return this._l1FeeTokenAddress;
        await this._checkL1Network(l1Provider);
        await this._checkL2Network(l2Provider);
        let l1FeeTokenAddress;
        try {
            l1FeeTokenAddress = await this.l2Erc20Bridger.getParentErc20Address(this.l2GasTokenAddress, l2Provider);
        }
        catch (e) {
            // if the error is a CALL_EXCEPTION, we can't find the token on L1
            // if the error is something else, rethrow
            if (e.code !== 'CALL_EXCEPTION') {
                throw e;
            }
        }
        if (!l1FeeTokenAddress ||
            l1FeeTokenAddress === ethers_1.ethers.constants.AddressZero) {
            throw new errors_1.ArbSdkError('L1 gas token not found. Use skipGasToken when depositing');
        }
        // make sure both the L1 and L2 tokens have 18 decimals
        if ((await ERC20__factory_1.ERC20__factory.connect(l1FeeTokenAddress, l1Provider).decimals()) !== 18) {
            throw new errors_1.ArbSdkError('L1 gas token has incorrect decimals. Use skipGasToken when depositing');
        }
        if ((await ERC20__factory_1.ERC20__factory.connect(this.l2GasTokenAddress, l2Provider).decimals()) !== 18) {
            throw new errors_1.ArbSdkError('L2 gas token has incorrect decimals. Use skipGasToken when depositing');
        }
        if (await this.l1TokenIsDisabled(l1FeeTokenAddress, l1Provider)) {
            throw new errors_1.ArbSdkError('L1 gas token is disabled on the L1 to L2 token bridge. Use skipGasToken when depositing');
        }
        if (await this.l2TokenIsDisabled(this.l2GasTokenAddress, l2Provider)) {
            throw new errors_1.ArbSdkError('L2 gas token is disabled on the L2 to L3 token bridge. Use skipGasToken when depositing');
        }
        return (this._l1FeeTokenAddress = l1FeeTokenAddress);
    }
    /**
     * Get the corresponding L2 token address for the provided L1 token
     */
    getL2Erc20Address(erc20L1Address, l1Provider) {
        return this.l2Erc20Bridger.getChildErc20Address(erc20L1Address, l1Provider);
    }
    /**
     * Get the corresponding L3 token address for the provided L1 token
     */
    async getL3Erc20Address(erc20L1Address, l1Provider, l2Provider) {
        return this.l3Erc20Bridger.getChildErc20Address(await this.getL2Erc20Address(erc20L1Address, l1Provider), l2Provider);
    }
    /**
     * Given an L1 token's address, get the address of the token's L1 <-> L2 gateway on L1
     */
    getL1L2GatewayAddress(erc20L1Address, l1Provider) {
        return this.l2Erc20Bridger.getParentGatewayAddress(erc20L1Address, l1Provider);
    }
    /**
     * Get the address of the L2 <-> L3 gateway on L2 given an L1 token address
     */
    async getL2L3GatewayAddress(erc20L1Address, l1Provider, l2Provider) {
        const l2Token = await this.getL2Erc20Address(erc20L1Address, l1Provider);
        return this.l3Erc20Bridger.getParentGatewayAddress(l2Token, l2Provider);
    }
    /**
     * Get the L1 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL1TokenContract(l1TokenAddr, l1Provider) {
        return IERC20__factory_1.IERC20__factory.connect(l1TokenAddr, l1Provider);
    }
    /**
     * Get the L2 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL2TokenContract(l2TokenAddr, l2Provider) {
        return L2GatewayToken__factory_1.L2GatewayToken__factory.connect(l2TokenAddr, l2Provider);
    }
    /**
     * Get the L3 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL3TokenContract(l3TokenAddr, l3Provider) {
        return L2GatewayToken__factory_1.L2GatewayToken__factory.connect(l3TokenAddr, l3Provider);
    }
    /**
     * Whether the L1 token has been disabled on the L1 <-> L2 router given an L1 token address
     */
    async l1TokenIsDisabled(l1TokenAddress, l1Provider) {
        return this.l2Erc20Bridger.isDepositDisabled(l1TokenAddress, l1Provider);
    }
    /**
     * Whether the L2 token has been disabled on the L2 <-> L3 router given an L2 token address
     */
    async l2TokenIsDisabled(l2TokenAddress, l2Provider) {
        return this.l3Erc20Bridger.isDepositDisabled(l2TokenAddress, l2Provider);
    }
    /**
     * Given some L2Forwarder parameters, get the address of the L2Forwarder contract
     */
    async l2ForwarderAddress(owner, routerOrInbox, destinationAddress, l1OrL2Provider) {
        const chainId = (await l1OrL2Provider.getNetwork()).chainId;
        let predictor;
        if (chainId === this.l1Network.chainId) {
            predictor = this.teleporter.l1Teleporter;
        }
        else if (chainId === this.l2Network.chainId) {
            predictor = this.teleporter.l2ForwarderFactory;
        }
        else {
            throw new errors_1.ArbSdkError(`Unknown chain id: ${chainId}`);
        }
        return IL2ForwarderPredictor__factory_1.IL2ForwarderPredictor__factory.connect(predictor, l1OrL2Provider).l2ForwarderAddress(owner, routerOrInbox, destinationAddress);
    }
    /**
     * Get a tx request to approve tokens for teleportation.
     * The tokens will be approved for L1Teleporter.
     */
    async getApproveTokenRequest(params) {
        const iface = IERC20__factory_1.IERC20__factory.createInterface();
        const data = iface.encodeFunctionData('approve', [
            this.teleporter.l1Teleporter,
            params.amount || ethers_1.ethers.constants.MaxUint256,
        ]);
        return {
            to: params.erc20L1Address,
            data,
            value: 0,
        };
    }
    /**
     * Approve tokens for teleportation.
     * The tokens will be approved for L1Teleporter.
     */
    async approveToken(params) {
        await this._checkL1Network(params.l1Signer);
        const approveRequest = 'txRequest' in params
            ? params.txRequest
            : await this.getApproveTokenRequest(params);
        return params.l1Signer.sendTransaction(Object.assign(Object.assign({}, approveRequest), params.overrides));
    }
    /**
     * Get a tx request to approve the L3's fee token for teleportation.
     * The tokens will be approved for L1Teleporter.
     * Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.
     */
    async getApproveGasTokenRequest(params) {
        return this.getApproveTokenRequest({
            erc20L1Address: await this.getGasTokenOnL1(params.l1Provider, params.l2Provider),
            amount: params.amount,
        });
    }
    /**
     * Approve the L3's fee token for teleportation.
     * The tokens will be approved for L1Teleporter.
     * Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.
     */
    async approveGasToken(params) {
        await this._checkL1Network(params.l1Signer);
        const approveRequest = 'txRequest' in params
            ? params.txRequest
            : await this.getApproveGasTokenRequest({
                l1Provider: params.l1Signer.provider,
                l2Provider: params.l2Provider,
                amount: params.amount,
            });
        return params.l1Signer.sendTransaction(Object.assign(Object.assign({}, approveRequest), params.overrides));
    }
    /**
     * Get a tx request for teleporting some tokens from L1 to L3.
     * Also returns the amount of fee tokens required for teleportation.
     */
    async getDepositRequest(params) {
        (0, networks_1.assertArbitrumNetworkHasTokenBridge)(this.l2Network);
        (0, networks_1.assertArbitrumNetworkHasTokenBridge)(this.l3Network);
        const l1Provider = 'l1Provider' in params ? params.l1Provider : params.l1Signer.provider;
        await this._checkL1Network(l1Provider);
        await this._checkL2Network(params.l2Provider);
        await this._checkL3Network(params.l3Provider);
        const from = 'from' in params ? params.from : await params.l1Signer.getAddress();
        let l1FeeToken;
        // if the l3 uses eth for fees, set to zero
        if (!this.l2GasTokenAddress) {
            l1FeeToken = ethers_1.ethers.constants.AddressZero;
        }
        // if the l3 uses custom fee but the user opts to skip payment, set to magic address
        else if (params.skipGasToken) {
            l1FeeToken = this.skipL1GasTokenMagic;
        }
        // if the l3 uses custom fee and the user opts to not skip, try to get the token
        // will throw if the token doesn't exist on L1 or is unsupported
        else {
            l1FeeToken = await this.getGasTokenOnL1(l1Provider, params.l2Provider);
        }
        const partialTeleportParams = {
            l1Token: params.erc20L1Address,
            l3FeeTokenL1Addr: l1FeeToken,
            l1l2Router: this.l2Network.tokenBridge.parentGatewayRouter,
            l2l3RouterOrInbox: l1FeeToken &&
                (0, utils_1.getAddress)(params.erc20L1Address) === (0, utils_1.getAddress)(l1FeeToken)
                ? this.l3Network.ethBridge.inbox
                : this.l3Network.tokenBridge.parentGatewayRouter,
            to: params.destinationAddress || from,
            amount: params.amount,
        };
        const { teleportParams, costs } = await this._fillPartialTeleportParams(partialTeleportParams, params.retryableOverrides || {}, l1Provider, params.l2Provider, params.l3Provider);
        const data = IL1Teleporter__factory_1.IL1Teleporter__factory.createInterface().encodeFunctionData('teleport', [teleportParams]);
        return {
            txRequest: {
                to: this.teleporter.l1Teleporter,
                data,
                value: costs.ethAmount,
            },
            gasTokenAmount: costs.feeTokenAmount,
        };
    }
    /**
     * Execute a teleportation of some tokens from L1 to L3.
     */
    async deposit(params) {
        await this._checkL1Network(params.l1Signer);
        const depositRequest = 'txRequest' in params
            ? params.txRequest
            : (await this.getDepositRequest(params)).txRequest;
        const tx = await params.l1Signer.sendTransaction(Object.assign(Object.assign({}, depositRequest), params.overrides));
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchContractCallWait(tx);
    }
    /**
     * Given a teleportation tx, get the L1Teleporter parameters, L2Forwarder parameters, and L2Forwarder address
     */
    async getDepositParameters(params) {
        await this._checkL1Network(params.l1Provider);
        await this._checkL2Network(params.l2Provider);
        const tx = await this._getTxFromTxRef(params, params.l1Provider);
        const txReceipt = await tx.wait();
        const l1l2Messages = await this._getL1ToL2Messages(txReceipt, params.l2Provider);
        const l2ForwarderParams = this._decodeCallForwarderCalldata(l1l2Messages.l2ForwarderFactoryRetryable.messageData.data);
        const l2ForwarderAddress = this.l2ForwarderAddress(l2ForwarderParams.owner, l2ForwarderParams.routerOrInbox, l2ForwarderParams.to, params.l2Provider);
        const teleportParams = this._decodeTeleportCalldata(tx.data);
        return {
            teleportParams,
            l2ForwarderParams,
            l2ForwarderAddress,
        };
    }
    /**
     * Fetch the cross chain messages and their status
     *
     * Can provide either the txHash, the tx, or the txReceipt
     */
    async getDepositStatus(params) {
        await this._checkL1Network(params.l1Provider);
        await this._checkL2Network(params.l2Provider);
        await this._checkL3Network(params.l3Provider);
        const l1TxReceipt = await this._getTxReceiptFromTxRef(params, params.l1Provider);
        const partialResult = await this._getL1ToL2Messages(l1TxReceipt, params.l2Provider);
        const factoryRedeem = await partialResult.l2ForwarderFactoryRetryable.getSuccessfulRedeem();
        const l2l3Message = factoryRedeem.status === ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED
            ? (await new ParentTransaction_1.ParentTransactionReceipt(factoryRedeem.childTxReceipt).getParentToChildMessages(params.l3Provider))[0]
            : undefined;
        // check if we got a race condition where another teleportation front ran the l2 forwarder factory call
        // if the balance is 0, l1l2TokenBridgeRetryable is redeemed, and l2ForwarderFactoryRetryable failed,
        // then another teleportation front ran the l2 forwarder factory call
        // set a flag to indicate this
        let l2ForwarderFactoryRetryableFrontRan = false;
        const l1l2TokenBridgeRetryableStatus = await partialResult.l1l2TokenBridgeRetryable.status();
        if (l1l2TokenBridgeRetryableStatus === ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED &&
            factoryRedeem.status ===
                ParentToChildMessage_1.ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD) {
            // decoding the factory call is the most reliable way to get the owner and other parameters
            const decodedFactoryCall = this._decodeCallForwarderCalldata(partialResult.l2ForwarderFactoryRetryable.messageData.data);
            // get the token balance of the l2 forwarder
            // we only do this check if the token bridge retryable has been redeemed, otherwise the token might not exist
            const balance = await IERC20__factory_1.IERC20__factory.connect(decodedFactoryCall.l2Token, params.l2Provider).balanceOf(await this.l2ForwarderAddress(decodedFactoryCall.owner, decodedFactoryCall.routerOrInbox, decodedFactoryCall.to, params.l2Provider));
            l2ForwarderFactoryRetryableFrontRan = balance.isZero();
        }
        return Object.assign(Object.assign({}, partialResult), { l2l3TokenBridgeRetryable: l2l3Message, l2ForwarderFactoryRetryableFrontRan, completed: (await (l2l3Message === null || l2l3Message === void 0 ? void 0 : l2l3Message.status())) === ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED });
    }
    /**
     * Get the type of teleportation from the l1Token and l3FeeTokenL1Addr teleport parameters
     */
    teleportationType(partialTeleportParams) {
        if (partialTeleportParams.l3FeeTokenL1Addr === ethers_1.ethers.constants.AddressZero) {
            return TeleportationType.Standard;
        }
        else if ((0, utils_1.getAddress)(partialTeleportParams.l1Token) ===
            (0, utils_1.getAddress)(partialTeleportParams.l3FeeTokenL1Addr)) {
            return TeleportationType.OnlyGasToken;
        }
        else {
            return TeleportationType.NonGasTokenToCustomGas;
        }
    }
    /**
     * Estimate the gasLimit and maxSubmissionFee for a token bridge retryable
     */
    async _getTokenBridgeGasEstimates(params) {
        const parentGateway = L1GatewayRouter__factory_1.L1GatewayRouter__factory.connect(params.parentGatewayAddress, params.parentProvider);
        const outboundCalldata = await parentGateway.getOutboundCalldata(params.parentErc20Address, params.from, params.to, params.amount, '0x');
        const estimates = await new ParentToChildMessageGasEstimator_1.ParentToChildMessageGasEstimator(params.childProvider).estimateAll({
            to: await parentGateway.counterpartGateway(),
            data: outboundCalldata,
            from: parentGateway.address,
            l2CallValue: params.isWeth ? params.amount : ethers_1.BigNumber.from(0),
            excessFeeRefundAddress: params.to,
            callValueRefundAddress: new address_1.Address(params.from).applyAlias().value,
        }, params.parentGasPrice, params.parentProvider);
        return {
            gasLimit: estimates.gasLimit,
            maxSubmissionFee: estimates.maxSubmissionCost,
        };
    }
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L1 to L2 token bridge leg of a teleportation
     */
    async _getL1L2TokenBridgeGasEstimates(params) {
        (0, networks_1.assertArbitrumNetworkHasTokenBridge)(this.l2Network);
        const parentGatewayAddress = await this.getL1L2GatewayAddress(params.l1Token, params.l1Provider);
        return this._getTokenBridgeGasEstimates({
            parentProvider: params.l1Provider,
            childProvider: params.l2Provider,
            parentGasPrice: params.l1GasPrice,
            parentErc20Address: params.l1Token,
            parentGatewayAddress,
            from: this.teleporter.l1Teleporter,
            to: params.l2ForwarderAddress,
            amount: ethers_1.BigNumber.from(params.amount),
            isWeth: (0, utils_1.getAddress)(parentGatewayAddress) ===
                (0, utils_1.getAddress)(this.l2Network.tokenBridge.parentWethGateway),
        });
    }
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L1 to L2 fee token bridge leg of a teleportation
     */
    async _getL1L2FeeTokenBridgeGasEstimates(params) {
        (0, networks_1.assertArbitrumNetworkHasTokenBridge)(this.l2Network);
        if (params.l3FeeTokenL1Addr === this.skipL1GasTokenMagic) {
            return {
                gasLimit: ethers_1.BigNumber.from(0),
                maxSubmissionFee: ethers_1.BigNumber.from(0),
            };
        }
        const parentGatewayAddress = await this.getL1L2GatewayAddress(params.l3FeeTokenL1Addr, params.l1Provider);
        return this._getTokenBridgeGasEstimates({
            parentProvider: params.l1Provider,
            childProvider: params.l2Provider,
            parentGasPrice: params.l1GasPrice,
            parentErc20Address: params.l3FeeTokenL1Addr,
            parentGatewayAddress,
            from: this.teleporter.l1Teleporter,
            to: params.l2ForwarderAddress,
            amount: params.feeTokenAmount,
            isWeth: (0, utils_1.getAddress)(parentGatewayAddress) ===
                (0, utils_1.getAddress)(this.l2Network.tokenBridge.parentWethGateway),
        });
    }
    /**
     * Estimate the gasLimit and maxSubmissionFee for L2ForwarderFactory.callForwarder leg of a teleportation.
     * Gas limit is hardcoded to 1,000,000
     */
    async _getL2ForwarderFactoryGasEstimates(l1GasPrice, l1Provider) {
        const inbox = Inbox__factory_1.Inbox__factory.connect(this.l2Network.ethBridge.inbox, l1Provider);
        const maxSubmissionFee = await inbox.calculateRetryableSubmissionFee(this._l2ForwarderFactoryCalldataSize(), l1GasPrice);
        return {
            gasLimit: this.l2ForwarderFactoryDefaultGasLimit,
            maxSubmissionFee,
        };
    }
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L2 -> L3 leg of a teleportation.
     */
    async _getL2L3BridgeGasEstimates(params) {
        (0, networks_1.assertArbitrumNetworkHasTokenBridge)(this.l3Network);
        const teleportationType = this.teleportationType(params.partialTeleportParams);
        if (teleportationType === TeleportationType.NonGasTokenToCustomGas &&
            params.partialTeleportParams.l3FeeTokenL1Addr === this.skipL1GasTokenMagic) {
            // we aren't paying for the retryable to L3
            return {
                gasLimit: ethers_1.BigNumber.from(0),
                maxSubmissionFee: ethers_1.BigNumber.from(0),
            };
        }
        else if (teleportationType === TeleportationType.OnlyGasToken) {
            // we are bridging the fee token to l3, this will not go through the l2l3 token bridge, instead it's just a regular retryable
            const estimate = await new ParentToChildMessageGasEstimator_1.ParentToChildMessageGasEstimator(params.l3Provider).estimateAll({
                to: params.partialTeleportParams.to,
                data: '0x',
                from: params.l2ForwarderAddress,
                // l2CallValue will be amount less the fees in reality
                l2CallValue: ethers_1.BigNumber.from(params.partialTeleportParams.amount),
                excessFeeRefundAddress: params.partialTeleportParams.to,
                callValueRefundAddress: params.partialTeleportParams.to,
            }, params.l2GasPrice, params.l2Provider);
            return {
                gasLimit: estimate.gasLimit,
                maxSubmissionFee: estimate.maxSubmissionCost,
            };
        }
        else {
            // we are bridging a non fee token to l3, this will go through the token bridge
            const parentGatewayAddress = await this.getL2L3GatewayAddress(params.partialTeleportParams.l1Token, params.l1Provider, params.l2Provider);
            return this._getTokenBridgeGasEstimates({
                parentProvider: params.l2Provider,
                childProvider: params.l3Provider,
                parentGasPrice: params.l2GasPrice,
                parentErc20Address: await this.getL2Erc20Address(params.partialTeleportParams.l1Token, params.l1Provider),
                parentGatewayAddress,
                from: params.l2ForwarderAddress,
                to: params.partialTeleportParams.to,
                amount: ethers_1.BigNumber.from(params.partialTeleportParams.amount),
                isWeth: (0, utils_1.getAddress)(parentGatewayAddress) ===
                    (0, utils_1.getAddress)(this.l3Network.tokenBridge.parentWethGateway),
            });
        }
    }
    /**
     * Given TeleportParams without the gas parameters, return TeleportParams with gas parameters populated.
     * Does not modify the input parameters.
     */
    async _fillPartialTeleportParams(partialTeleportParams, retryableOverrides, l1Provider, l2Provider, l3Provider) {
        // get gasLimit and submission cost for a retryable while respecting overrides
        const getRetryableGasValuesWithOverrides = async (overrides, getEstimates) => {
            var _a, _b, _c, _d, _e, _f, _g;
            let base;
            if (((_a = overrides === null || overrides === void 0 ? void 0 : overrides.gasLimit) === null || _a === void 0 ? void 0 : _a.base) && ((_b = overrides === null || overrides === void 0 ? void 0 : overrides.maxSubmissionFee) === null || _b === void 0 ? void 0 : _b.base)) {
                base = {
                    gasLimit: overrides.gasLimit.base,
                    maxSubmissionFee: overrides.maxSubmissionFee.base,
                };
            }
            else {
                const calculated = await getEstimates();
                base = {
                    gasLimit: ((_c = overrides === null || overrides === void 0 ? void 0 : overrides.gasLimit) === null || _c === void 0 ? void 0 : _c.base) || calculated.gasLimit,
                    maxSubmissionFee: ((_d = overrides === null || overrides === void 0 ? void 0 : overrides.maxSubmissionFee) === null || _d === void 0 ? void 0 : _d.base) || calculated.maxSubmissionFee,
                };
            }
            const gasLimit = this._percentIncrease(base.gasLimit, ((_e = overrides === null || overrides === void 0 ? void 0 : overrides.gasLimit) === null || _e === void 0 ? void 0 : _e.percentIncrease) ||
                this.defaultGasLimitPercentIncrease);
            const submissionFee = this._percentIncrease(base.maxSubmissionFee, ((_f = overrides === null || overrides === void 0 ? void 0 : overrides.maxSubmissionFee) === null || _f === void 0 ? void 0 : _f.percentIncrease) || ethers_1.BigNumber.from(0));
            const minGasLimit = ((_g = overrides === null || overrides === void 0 ? void 0 : overrides.gasLimit) === null || _g === void 0 ? void 0 : _g.min) || ethers_1.BigNumber.from(0);
            return {
                gasLimit: gasLimit.gt(minGasLimit) ? gasLimit : minGasLimit,
                maxSubmissionFee: submissionFee,
            };
        };
        // get gas price while respecting overrides
        const applyGasPercentIncrease = async (overrides, getEstimate) => {
            return this._percentIncrease((overrides === null || overrides === void 0 ? void 0 : overrides.base) || (await getEstimate()), (overrides === null || overrides === void 0 ? void 0 : overrides.percentIncrease) || this.defaultGasPricePercentIncrease);
        };
        const l1GasPrice = await applyGasPercentIncrease(retryableOverrides.l1GasPrice, () => l1Provider.getGasPrice());
        const l2GasPrice = await applyGasPercentIncrease(retryableOverrides.l2GasPrice, () => l2Provider.getGasPrice());
        const l3GasPrice = partialTeleportParams.l3FeeTokenL1Addr === this.skipL1GasTokenMagic
            ? ethers_1.BigNumber.from(0)
            : await applyGasPercentIncrease(retryableOverrides.l3GasPrice, () => l3Provider.getGasPrice());
        const fakeRandomL2Forwarder = ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(20));
        const l1l2TokenBridgeGasValues = await getRetryableGasValuesWithOverrides(retryableOverrides.l1l2TokenBridgeRetryableGas, () => this._getL1L2TokenBridgeGasEstimates({
            l1Token: partialTeleportParams.l1Token,
            amount: partialTeleportParams.amount,
            l1GasPrice,
            l2ForwarderAddress: fakeRandomL2Forwarder,
            l1Provider,
            l2Provider,
        }));
        const l2ForwarderFactoryGasValues = await getRetryableGasValuesWithOverrides(retryableOverrides.l2ForwarderFactoryRetryableGas, () => this._getL2ForwarderFactoryGasEstimates(l1GasPrice, l1Provider));
        const l2l3TokenBridgeGasValues = await getRetryableGasValuesWithOverrides(retryableOverrides.l2l3TokenBridgeRetryableGas, () => this._getL2L3BridgeGasEstimates({
            partialTeleportParams,
            l2GasPrice,
            l1Provider,
            l2Provider,
            l3Provider,
            l2ForwarderAddress: fakeRandomL2Forwarder,
        }));
        let l1l2FeeTokenBridgeGasValues;
        if (this.teleportationType(partialTeleportParams) ===
            TeleportationType.NonGasTokenToCustomGas) {
            l1l2FeeTokenBridgeGasValues = await getRetryableGasValuesWithOverrides(retryableOverrides.l1l2GasTokenBridgeRetryableGas, () => this._getL1L2FeeTokenBridgeGasEstimates({
                l1GasPrice,
                feeTokenAmount: l2l3TokenBridgeGasValues.gasLimit
                    .mul(l3GasPrice)
                    .add(l2l3TokenBridgeGasValues.maxSubmissionFee),
                l3FeeTokenL1Addr: partialTeleportParams.l3FeeTokenL1Addr,
                l2ForwarderAddress: fakeRandomL2Forwarder,
                l1Provider,
                l2Provider,
            }));
        }
        else {
            // eth fee l3, or only bridging fee token. this retryable will not be created
            l1l2FeeTokenBridgeGasValues = {
                gasLimit: ethers_1.BigNumber.from(0),
                maxSubmissionFee: ethers_1.BigNumber.from(0),
            };
        }
        const gasParams = {
            l2GasPriceBid: l2GasPrice,
            l3GasPriceBid: l3GasPrice,
            l1l2TokenBridgeGasLimit: l1l2TokenBridgeGasValues.gasLimit,
            l1l2FeeTokenBridgeGasLimit: l1l2FeeTokenBridgeGasValues.gasLimit,
            l2l3TokenBridgeGasLimit: l2l3TokenBridgeGasValues.gasLimit,
            l2ForwarderFactoryGasLimit: l2ForwarderFactoryGasValues.gasLimit,
            l2ForwarderFactoryMaxSubmissionCost: l2ForwarderFactoryGasValues.maxSubmissionFee,
            l1l2TokenBridgeMaxSubmissionCost: l1l2TokenBridgeGasValues.maxSubmissionFee,
            l1l2FeeTokenBridgeMaxSubmissionCost: l1l2FeeTokenBridgeGasValues.maxSubmissionFee,
            l2l3TokenBridgeMaxSubmissionCost: l2l3TokenBridgeGasValues.maxSubmissionFee,
        };
        const teleportParams = Object.assign(Object.assign({}, partialTeleportParams), { gasParams });
        const costs = await IL1Teleporter__factory_1.IL1Teleporter__factory.connect(this.teleporter.l1Teleporter, l1Provider).determineTypeAndFees(teleportParams);
        return {
            teleportParams,
            costs,
        };
    }
    /**
     * @returns The size of the calldata for a call to L2ForwarderFactory.callForwarder
     */
    _l2ForwarderFactoryCalldataSize() {
        const struct = {
            owner: ethers_1.ethers.constants.AddressZero,
            l2Token: ethers_1.ethers.constants.AddressZero,
            l3FeeTokenL2Addr: ethers_1.ethers.constants.AddressZero,
            routerOrInbox: ethers_1.ethers.constants.AddressZero,
            to: ethers_1.ethers.constants.AddressZero,
            gasLimit: 0,
            gasPriceBid: 0,
            maxSubmissionCost: 0,
        };
        const dummyCalldata = IL2ForwarderFactory__factory_1.IL2ForwarderFactory__factory.createInterface().encodeFunctionData('callForwarder', [struct]);
        return ethers_1.ethers.utils.hexDataLength(dummyCalldata) - 4;
    }
    /**
     * Given raw calldata for a teleport tx, decode the teleport parameters
     */
    _decodeTeleportCalldata(data) {
        const iface = IL1Teleporter__factory_1.IL1Teleporter__factory.createInterface();
        const decoded = iface.parseTransaction({ data });
        if (decoded.functionFragment.name !== 'teleport') {
            throw new errors_1.ArbSdkError(`not a teleport tx`);
        }
        return decoded.args[0];
    }
    /**
     * Given raw calldata for a callForwarder call, decode the parameters
     */
    _decodeCallForwarderCalldata(data) {
        const iface = IL2ForwarderFactory__factory_1.IL2ForwarderFactory__factory.createInterface();
        const decoded = iface.parseTransaction({ data });
        if (decoded.functionFragment.name !== 'callForwarder') {
            throw new errors_1.ArbSdkError(`not callForwarder data`);
        }
        return decoded.args[0];
    }
    async _getL1ToL2Messages(l1TxReceipt, l2Provider) {
        const l1l2Messages = await l1TxReceipt.getParentToChildMessages(l2Provider);
        let partialResult;
        if (l1l2Messages.length === 2) {
            partialResult = {
                l1l2TokenBridgeRetryable: l1l2Messages[0],
                l2ForwarderFactoryRetryable: l1l2Messages[1],
                l1l2GasTokenBridgeRetryable: undefined,
            };
        }
        else {
            partialResult = {
                l1l2GasTokenBridgeRetryable: l1l2Messages[0],
                l1l2TokenBridgeRetryable: l1l2Messages[1],
                l2ForwarderFactoryRetryable: l1l2Messages[2],
            };
        }
        return partialResult;
    }
}
exports.Erc20L1L3Bridger = Erc20L1L3Bridger;
/**
 * Bridge ETH from L1 to L3 using a double retryable ticket
 */
class EthL1L3Bridger extends BaseL1L3Bridger {
    constructor(l3Network) {
        super(l3Network);
        if (l3Network.nativeToken &&
            l3Network.nativeToken !== ethers_1.ethers.constants.AddressZero) {
            throw new errors_1.ArbSdkError(`L3 network ${l3Network.name} uses a custom fee token`);
        }
    }
    /**
     * Get a tx request to deposit ETH to L3 via a double retryable ticket
     */
    async getDepositRequest(params) {
        const l1Provider = 'l1Provider' in params ? params.l1Provider : params.l1Signer.provider;
        await this._checkL1Network(l1Provider);
        await this._checkL2Network(params.l2Provider);
        await this._checkL3Network(params.l3Provider);
        const from = 'from' in params ? params.from : await params.l1Signer.getAddress();
        const l3DestinationAddress = params.destinationAddress || from;
        const l2RefundAddress = params.l2RefundAddress || from;
        const l3TicketRequest = await ParentToChildMessageCreator_1.ParentToChildMessageCreator.getTicketCreationRequest({
            to: l3DestinationAddress,
            data: '0x',
            from: new address_1.Address(from).applyAlias().value,
            l2CallValue: ethers_1.BigNumber.from(params.amount),
            excessFeeRefundAddress: l3DestinationAddress,
            callValueRefundAddress: l3DestinationAddress,
        }, params.l2Provider, params.l3Provider, params.l3TicketGasOverrides);
        const l2TicketRequest = await ParentToChildMessageCreator_1.ParentToChildMessageCreator.getTicketCreationRequest({
            from,
            to: l3TicketRequest.txRequest.to,
            l2CallValue: ethers_1.BigNumber.from(l3TicketRequest.txRequest.value),
            data: ethers_1.ethers.utils.hexlify(l3TicketRequest.txRequest.data),
            excessFeeRefundAddress: l2RefundAddress,
            callValueRefundAddress: l2RefundAddress,
        }, l1Provider, params.l2Provider, params.l2TicketGasOverrides);
        return l2TicketRequest;
    }
    /**
     * Deposit ETH to L3 via a double retryable ticket
     */
    async deposit(params) {
        await this._checkL1Network(params.l1Signer);
        const depositRequest = 'txRequest' in params
            ? params.txRequest
            : (await this.getDepositRequest(params)).txRequest;
        const tx = await params.l1Signer.sendTransaction(Object.assign(Object.assign({}, depositRequest), params.overrides));
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchContractCallWait(tx);
    }
    /**
     * Given an L1 transaction, get the retryable parameters for both l2 and l3 tickets
     */
    async getDepositParameters(params) {
        await this._checkL1Network(params.l1Provider);
        const tx = await this._getTxFromTxRef(params, params.l1Provider);
        const l1l2TicketData = Object.assign(Object.assign({}, this._decodeCreateRetryableTicket(tx.data)), { l1Value: tx.value });
        const l2l3TicketData = Object.assign(Object.assign({}, this._decodeCreateRetryableTicket(l1l2TicketData.data)), { l1Value: l1l2TicketData.l2CallValue });
        return {
            l1l2TicketData,
            l2l3TicketData,
        };
    }
    /**
     * Get the status of a deposit given an L1 tx receipt. Does not check if the tx is actually a deposit tx.
     *
     * @return Information regarding each step of the deposit
     * and `EthL1L3DepositStatus.completed` which indicates whether the deposit has fully completed.
     */
    async getDepositStatus(params) {
        await this._checkL1Network(params.l1Provider);
        await this._checkL2Network(params.l2Provider);
        await this._checkL3Network(params.l3Provider);
        const l1TxReceipt = await this._getTxReceiptFromTxRef(params, params.l1Provider);
        const l1l2Message = (await l1TxReceipt.getParentToChildMessages(params.l2Provider))[0];
        const l1l2Redeem = await l1l2Message.getSuccessfulRedeem();
        if (l1l2Redeem.status != ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED) {
            return {
                l2Retryable: l1l2Message,
                l3Retryable: undefined,
                completed: false,
            };
        }
        const l2l3Message = (await new ParentTransaction_1.ParentEthDepositTransactionReceipt(l1l2Redeem.childTxReceipt).getParentToChildMessages(params.l3Provider))[0];
        if (l2l3Message === undefined) {
            throw new errors_1.ArbSdkError(`L2 to L3 message not found`);
        }
        return {
            l2Retryable: l1l2Message,
            l3Retryable: l2l3Message,
            completed: (await l2l3Message.status()) === ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED,
        };
    }
    _decodeCreateRetryableTicket(data) {
        const iface = IInbox__factory_1.IInbox__factory.createInterface();
        const decoded = iface.parseTransaction({ data });
        if (decoded.functionFragment.name !== 'createRetryableTicket') {
            throw new errors_1.ArbSdkError(`not createRetryableTicket data`);
        }
        const args = decoded.args;
        return {
            destAddress: args[0],
            l2CallValue: args[1],
            maxSubmissionFee: args[2],
            excessFeeRefundAddress: args[3],
            callValueRefundAddress: args[4],
            gasLimit: args[5],
            maxFeePerGas: args[6],
            data: args[7],
        };
    }
}
exports.EthL1L3Bridger = EthL1L3Bridger;
