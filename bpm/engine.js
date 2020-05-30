const xml2js = require('xml2js');
const _ = require('lodash');
const vm = require('vm');
const EventEmitter = require('events');
const { Logger, logger } = require('./logger');

const parser = new xml2js.Parser();


function assertArrayLen(arr, len) {
    if (!arr || !(arr instanceof Array)) {
        throw new Error(`required an array, not ${JSON.stringify(arr)}`);
    }
    if (arr.length != len) {
        throw new Error(`required an array of ${len}, not ${arr.length}, ${JSON.stringify(arr)}`);
    }
}

function getOne(arr) {
    assertArrayLen(arr, 1);
    return arr[0];
}


class ProcessDefinition {

    constructor(processDef, funcs) {
        this.expressionEvaluator = new ExpressionEvaluator();
        this.processDef = processDef;
        this.funcs = funcs;

        const process = this.process = getOne(this.processDef['bpmn2:definitions']['bpmn2:process']);
        this.startEvent = getOne(process['bpmn2:startEvent']);
        this.endEvents = process['bpmn2:endEvent']
            .map(evt => [evt.$.id, evt['bpmn2:incoming']])
            .reduce((acc, cur) => { acc[cur[0]] = cur[1]; return acc; }, {});
        this.sequenceFlows = process['bpmn2:sequenceFlow'] ?
            process['bpmn2:sequenceFlow']
                .map(flow => flow)
                .reduce((acc, cur) => {
                    const flow = acc[cur.$.id] = cur.$;
                    flow.condition = cur['bpmn2:conditionExpression'] ? getOne(cur['bpmn2:conditionExpression'])._ : null;
                    if (flow.condition && !/^\s*\$\{(.*)\}\s*$/.test(flow.condition)) {
                        throw new Error(`expression must be of pattern /^\s*\$\{(.*)\}\s*$/, not '${flow.condition}'`);
                    }
                    flow.condition = flow.condition && flow.condition.match(/^\s*\$\{(.*)\}\s*$/)[1];
                    return acc;
                }, {}) : [];
        this.serviceTasks = process['bpmn2:serviceTask'] ?
            process['bpmn2:serviceTask']
                .reduce((acc, cur) => {
                    const task = acc[cur.$.id] = cur.$;
                    task.incoming = getOne(cur['bpmn2:incoming']);
                    task.outgoing = getOne(cur['bpmn2:outgoing']);
                    return acc;
                }, {}) : [];
        this.exclusiveGateways = process['bpmn2:exclusiveGateway'] ?
            process['bpmn2:exclusiveGateway']
                .map(gw => {
                    return { id: gw.$.id, incoming: getOne(gw['bpmn2:incoming']), outgoings: gw['bpmn2:outgoing'] };
                })
                .reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {}) : [];

        this.parallelGateways = process['bpmn2:parallelGateway'] ?
        process['bpmn2:parallelGateway']
            .map(gw => {
                return { id: gw.$.id, incomings: gw['bpmn2:incoming'], outgoings: gw['bpmn2:outgoing'] };
            })
            .reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {}) : [];

        const notSupportedElements = _.difference(
            _.keys(process),
            [
                '$', 'bpmn2:documentation', 'bpmn2:startEvent', 'bpmn2:endEvent', 'bpmn2:sequenceFlow', 'bpmn2:serviceTask',
                'bpmn2:exclusiveGateway', 'bpmn2:parallelGateway'
            ]);
        if (notSupportedElements.length != 0) {
            throw new Error(`elements not supported: ${notSupportedElements}`);
        }

        const notDefinedServiceTasks = _.difference(
            Object.keys(this.serviceTasks).map(serviceTaskId => this.serviceTasks[serviceTaskId].implementation),
            Object.keys(this.funcs)
        )
        if (notDefinedServiceTasks.length > 0) {
            throw new Error(`service task implementation ${notSupportedElements} not defined`);
        }
    }

    static async from(xml, funcs) {
        const processDef = await parser.parseStringPromise(xml);
        // logger.debug(JSON.stringify(processDef))
        return new ProcessDefinition(processDef, funcs);
    }

    static async validate(xml, funcs) {
        await ProcessDefinition.from(xml, funcs);
        return true;
    }

    buildExecutionFlow(states) {
        const processRun = new ProcessRun(states);
        let result = processRun._getStartPromise();
        result = this._buildExecutionFlow(result, states);
        processRun._setResultPromise(result);
        return processRun;
    }

    _buildExecutionFlow(result, states, taskId) {
        const proccess = this.process,
            startEvent = this.startEvent,
            endEvents = this.endEvents,
            sequenceFlows = this.sequenceFlows,
            serviceTasks = this.serviceTasks,
            exclusiveGateways = this.exclusiveGateways,
            parallelGateways = this.parallelGateways;

        if (taskId && taskId in states._internals.executed) {
            throw new Error(`circular flow found, task(${taskId}) is already executed!`);
        }

        taskId = taskId || sequenceFlows[getOne(startEvent['bpmn2:outgoing'])].targetRef;
        states._internals.executed[taskId] = true;

        if (taskId in exclusiveGateways) {
            return this._buildExecutionFlowForExclusiveGateway(result, states, exclusiveGateways[taskId]);
        } else if (taskId in parallelGateways) {
            return this._buildExecutionFlowForParallelGateways(result, states, parallelGateways[taskId]);
        } else if (taskId in serviceTasks) {
            return this._buildExecutionFlowForServiceTask(result, states, serviceTasks[taskId]);
        } else if (taskId in endEvents) {
            return result;
        }
    }

    _buildExecutionFlowForParallelGateways(result, state, task) {
        const self = this, sequenceFlows = this.sequenceFlows;
        task.outgoings.forEach(flowId => {
            if (!(flowId in sequenceFlows)) {
                throw new Error(`flow not found: ${flowId}`);
            }
        });
        return result.then(states => {
            logger.debug(`trigger parallel tasks: ${task.id}`)
            return Promise
                .all(task.outgoings
                    .map(taskId => sequenceFlows[taskId].targetRef)
                    .map(taskId => self._buildExecutionFlow(result, states, taskId)))
                .then(() => states);
        });
    }

    _buildExecutionFlowForExclusiveGateway(result, states, task) {
        const self = this, sequenceFlows = this.sequenceFlows;
        task.outgoings.forEach(flowId => {
            if (!(flowId in sequenceFlows)) {
                throw new Error(`flow not found: ${flowId}`);
            }
        });
        return result.then(states => {
            let nextFlowId = _.find(task.outgoings,
                flowId => {
                    const conditionResult = self.expressionEvaluator.evaluate(states, sequenceFlows[flowId].condition);
                    logger.debug(`execute condition '${sequenceFlows[flowId].condition}' under context ${states.json()}, got ${conditionResult}`);
                    return conditionResult;
                });
            if (!nextFlowId) {
                nextFlowId = _.last(task.outgoings);
                logger.debug(`no next flow found for gateway ${task.id}, defaults to the last one ${nextFlowId}`);
            }
            const nextTaskId = sequenceFlows[nextFlowId].targetRef;
            return self._buildExecutionFlow(result, states, nextTaskId);
        });
    }

    _buildExecutionFlowForServiceTask(result, states, task) {
        if (!(task.implementation in this.funcs)) {
            throw new Error(`function not found: ${task.implementation}`);
        }

        const self = this, sequenceFlows = this.sequenceFlows, parallelGateways = this.parallelGateways;
        let taskFunc = this.funcs[task.implementation];
        return result.then(states => {
            try {
                let taskResult = taskFunc(states);
                if (!(taskResult instanceof Promise)) {
                    throw new Error(`error found when call task ${task.name}(${task.id}): result of the function must be a Promise object`);
                }
                return taskResult.then(() => {
                    logger.debug(`states after task ${task.name}(${task.id}): ${states.json()}`);
                    return states;
                });
            } catch (err) {
                throw new Error(`error found when call task ${task.name}(${task.id}): ${err.message}`);
            }
        }).then(states => {
            let nextTaskId = sequenceFlows[task.outgoing].targetRef;
            logger.debug(`trigger next task in serviceTask: ${nextTaskId}`)
            if (nextTaskId in parallelGateways && parallelGateways[nextTaskId].incomings.length > 1) {
                if (!(nextTaskId in states._internals.parallelGateways)) {
                    states._internals.parallelGateways[nextTaskId] = 0;
                }
                states._internals.parallelGateways[nextTaskId] += 1;
                const parallelGatewayFinished = states._internals.parallelGateways[nextTaskId] === parallelGateways[nextTaskId].incomings.length;
                if (parallelGatewayFinished) {
                    const taskIdAfterGateway = sequenceFlows[getOne(parallelGateways[nextTaskId].outgoings)].targetRef;
                    const progress = `${states._internals.parallelGateways[nextTaskId]} / ${parallelGateways[nextTaskId].incomings.length}`;
                    logger.debug(`parallel gateway ${nextTaskId} finished (${progress}), triggerring next task: ${taskIdAfterGateway}`);
                    return self._buildExecutionFlow(result, states, taskIdAfterGateway);
                } else {
                    const progress = `${states._internals.parallelGateways[nextTaskId]} / ${parallelGateways[nextTaskId].incomings.length}`;
                    logger.debug(`parallel gateway ${nextTaskId} not finished yet (${progress}), will not trigger next task`);
                    return states;
                }
            } else {
                return self._buildExecutionFlow(result, states, nextTaskId);
            }
        });
    }
}


class ExpressionEvaluator {

    evaluate(context, script) {
        return new vm.Script(script).runInContext(vm.createContext(context));
    }

}


class ProcessRun {

    constructor(states) {
        this.event = new EventEmitter();
        const self = this;
        this._startPromise = new Promise((resolve, reject) => {
            self.event.on('start', () => resolve(states));
            self.event.on('cancel', () => reject('canceled'));
        });
        this._resultPromise = null;
    }

    static from(processDef, states) {
        return processDef.buildExecutionFlow(states);
    }

    _getStartPromise() {
        return this._startPromise;
    }

    _setResultPromise(resultPromise) {
        this._resultPromise = resultPromise;
    }

    start() {
        this.event.emit('start');
        return this._resultPromise;
    }

    delete() {
        this._startPromise.catch(err => logger.debug('canceled process promise'));
        this.event.emit('cancel');
    }
}


class ProcessRunStates {

    constructor() {
        this._internals = { parallelGateways: {}, executed: {} };
    }

    json() {
        const jsonObj = _.clone(this);
        delete jsonObj._internals;
        return JSON.stringify(jsonObj);
    }

}


module.exports = {
    logger: logger,
    Logger: Logger,
    ProcessDefinition: ProcessDefinition,
    ProcessRun: ProcessRun,
    ProcessRunStates: ProcessRunStates
}
