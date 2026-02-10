"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTypedLogs = exports.parseTypedLog = void 0;
/**
 * Parse a log that matches a given filter name.
 * @param contractFactory
 * @param log The log to parse
 * @param filterName
 * @returns Null if filter name topic does not match log topic
 */
const parseTypedLog = (contractFactory, log, filterName) => {
    const iFace = contractFactory.createInterface();
    const event = iFace.getEvent(filterName);
    const topic = iFace.getEventTopic(event);
    if (log.topics[0] === topic) {
        return iFace.parseLog(log).args;
    }
    else
        return null;
};
exports.parseTypedLog = parseTypedLog;
/**
 * Parses an array of logs.
 * Filters out any logs whose topic does not match provided the filter name topic.
 * @param contractFactory
 * @param logs The logs to parse
 * @param filterName
 * @returns
 */
const parseTypedLogs = (contractFactory, logs, filterName) => {
    return logs
        .map(l => (0, exports.parseTypedLog)(contractFactory, l, filterName))
        .filter((i) => i !== null);
};
exports.parseTypedLogs = parseTypedLogs;
