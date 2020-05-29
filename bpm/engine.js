const xml2js = require('xml2js');
const _ = require('lodash');
const vm = require('vm');

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
        this.processDef = processDef;
        this.funcs = funcs;
    }

    static async from(xml, funcs) {
        const processDef = await parser.parseStringPromise(xml);
        console.log(JSON.stringify(processDef))
        return new ProcessDefinition(processDef, funcs);
    }

    async run(states) {
        try {
            const process = getOne(this.processDef['bpmn2:definitions']['bpmn2:process']);
            const startEvent = getOne(process['bpmn2:startEvent']);
            const endEvents = process['bpmn2:endEvent']
                .map(evt => [evt.$.id, evt['bpmn2:incoming']])
                .reduce((acc, cur) => { acc[cur[0]] = cur[1]; return acc; }, {});
            const sequenceFlows = process['bpmn2:sequenceFlow']
                .map(flow => flow.$)
                .reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {});
            const serviceTasks = process['bpmn2:serviceTask']
                .reduce((acc, cur) => {
                    const task = acc[cur.$.id] = cur.$;
                    task.incoming = getOne(cur['bpmn2:incoming']);
                    task.outgoing = getOne(cur['bpmn2:outgoing']);
                    return acc;
                }, {});

            const notSupportedElements = _.difference(
                _.keys(process),
                ['$', 'bpmn2:documentation', 'bpmn2:startEvent', 'bpmn2:endEvent', 'bpmn2:sequenceFlow', 'bpmn2:serviceTask']);
            if (notSupportedElements.length != 0) {
                throw new Error(`elements not supported: ${notSupportedElements}`);
            }

            let self = this;
            let curTask = serviceTasks[sequenceFlows[getOne(startEvent['bpmn2:outgoing'])].targetRef];
            let result = Promise.resolve(states);
            let taskExecuted = {};
            while (true) {
                if (!(curTask.implementation in self.funcs)) {
                    throw new Error(`function not found: ${curTask.implementation}`);
                }

                let taskFunc = self.funcs[curTask.implementation];
                let task = curTask;
                result = result.then(states => {
                    try {
                        let taskResult = taskFunc(states);
                        if (!(taskResult instanceof Promise)) {
                            throw new Error(`error found when call task ${task.name}(${task.id}): result of the function must be a Promise object`);
                        }
                        return taskResult.then(() => {
                            console.log(`states after task ${task.name}(${task.id}): `, states);
                            return states;
                        });
                    } catch (err) {
                        throw new Error(`error found when call task ${task.name}(${task.id}): ${err.message}`);
                    }
                });

                taskExecuted[curTask.id] = true;

                const nextTaskId = sequenceFlows[curTask.outgoing].targetRef;
                if (nextTaskId in endEvents) {
                    break;
                }

                if (nextTaskId in taskExecuted) {
                    throw new Error(`circular flow found, task(${nextTaskId}) is already executed!`);
                }

                curTask = serviceTasks[nextTaskId];
            }

            return result;
        } catch (err) {
            return Promise.reject(err.message);
        }
    }
}





module.exports = {
    ProcessDefinition: ProcessDefinition,
    ProcessRunStates: Object
}
