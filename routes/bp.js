var express = require('express');
var router = express.Router();
const { ProcessDefinition, ProcessRun, ProcessRunStates } = require('../bpm/engine');
const FileSystemStore = require('../bpm/store').FileSystemStore;
const { Logger, logger } = require('../bpm/logger');


let store = new FileSystemStore('./data');
function setStore(_store) {
  store = _store;
}


const processDef = `
        <?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="automation-with-gateways" isExecutable="true">
    <bpmn2:documentation />
    <bpmn2:startEvent id="StartEvent_1">
      <bpmn2:outgoing>SequenceFlow_1k98z8o</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_1k98z8o" sourceRef="StartEvent_1" targetRef="ServiceTask_0em0nmt" />
    <bpmn2:sequenceFlow id="SequenceFlow_1ltlcxk" sourceRef="ServiceTask_0em0nmt" targetRef="ServiceTask_0tt533q" />
    <bpmn2:serviceTask id="ServiceTask_0em0nmt" name="a" implementation="a">
      <bpmn2:incoming>SequenceFlow_1k98z8o</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1ltlcxk</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_0tt533q" name="b" implementation="b">
      <bpmn2:incoming>SequenceFlow_1ltlcxk</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_0s9rdg1</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_1s6d5g9" name="c1" implementation="c1">
      <bpmn2:incoming>SequenceFlow_1nms7xk</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_0f54nth</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:sequenceFlow id="SequenceFlow_0s9rdg1" sourceRef="ServiceTask_0tt533q" targetRef="ParallelGateway_0e6mfrn" />
    <bpmn2:sequenceFlow id="SequenceFlow_1nms7xk" sourceRef="ParallelGateway_0e6mfrn" targetRef="ServiceTask_1s6d5g9" />
    <bpmn2:sequenceFlow id="SequenceFlow_1snyf24" sourceRef="ParallelGateway_0e6mfrn" targetRef="ServiceTask_1vtal80" />
    <bpmn2:serviceTask id="ServiceTask_1vtal80" name="c2" implementation="c2">
      <bpmn2:incoming>SequenceFlow_1snyf24</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1n6wkir</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:parallelGateway id="ParallelGateway_0e6mfrn">
      <bpmn2:incoming>SequenceFlow_0s9rdg1</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1nms7xk</bpmn2:outgoing>
      <bpmn2:outgoing>SequenceFlow_1snyf24</bpmn2:outgoing>
      <bpmn2:outgoing>SequenceFlow_1oru9bc</bpmn2:outgoing>
      <bpmn2:outgoing>SequenceFlow_1pbz4gt</bpmn2:outgoing>
    </bpmn2:parallelGateway>
    <bpmn2:sequenceFlow id="SequenceFlow_0f54nth" sourceRef="ServiceTask_1s6d5g9" targetRef="ParallelGateway_1e21h7s" />
    <bpmn2:parallelGateway id="ParallelGateway_1e21h7s">
      <bpmn2:incoming>SequenceFlow_0f54nth</bpmn2:incoming>
      <bpmn2:incoming>SequenceFlow_1n6wkir</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1v2ju2e</bpmn2:outgoing>
    </bpmn2:parallelGateway>
    <bpmn2:sequenceFlow id="SequenceFlow_1n6wkir" sourceRef="ServiceTask_1vtal80" targetRef="ParallelGateway_1e21h7s" />
    <bpmn2:sequenceFlow id="SequenceFlow_1v2ju2e" sourceRef="ParallelGateway_1e21h7s" targetRef="ServiceTask_0xjfg6v" />
    <bpmn2:serviceTask id="ServiceTask_0xjfg6v" name="d" implementation="d">
      <bpmn2:incoming>SequenceFlow_1v2ju2e</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_0ohyqkc</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:sequenceFlow id="SequenceFlow_1oru9bc" sourceRef="ParallelGateway_0e6mfrn" targetRef="ServiceTask_0zg8uik" />
    <bpmn2:sequenceFlow id="SequenceFlow_0clgvcw" sourceRef="ServiceTask_0zg8uik" targetRef="ParallelGateway_1wickz2" />
    <bpmn2:parallelGateway id="ParallelGateway_1wickz2">
      <bpmn2:incoming>SequenceFlow_0clgvcw</bpmn2:incoming>
      <bpmn2:incoming>SequenceFlow_0ohyqkc</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1ymt8mi</bpmn2:outgoing>
    </bpmn2:parallelGateway>
    <bpmn2:sequenceFlow id="SequenceFlow_0ohyqkc" sourceRef="ServiceTask_0xjfg6v" targetRef="ParallelGateway_1wickz2" />
    <bpmn2:sequenceFlow id="SequenceFlow_1ymt8mi" sourceRef="ParallelGateway_1wickz2" targetRef="ServiceTask_11tdp0w" />
    <bpmn2:serviceTask id="ServiceTask_11tdp0w" name="e" implementation="e">
      <bpmn2:incoming>SequenceFlow_1ymt8mi</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_0tpphlm</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_0zg8uik" name="c3" implementation="c3">
      <bpmn2:incoming>SequenceFlow_1oru9bc</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_0clgvcw</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:endEvent id="EndEvent_0lc1k0u">
      <bpmn2:incoming>SequenceFlow_0tpphlm</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_0tpphlm" sourceRef="ServiceTask_11tdp0w" targetRef="EndEvent_0lc1k0u" />
    <bpmn2:sequenceFlow id="SequenceFlow_1pbz4gt" sourceRef="ParallelGateway_0e6mfrn" targetRef="ServiceTask_0x25rub" />
    <bpmn2:serviceTask id="ServiceTask_0x25rub" name="c4" implementation="c4">
      <bpmn2:incoming>SequenceFlow_1pbz4gt</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1eu52fa</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_1p86a2s" name="c41" implementation="c41">
      <bpmn2:incoming>SequenceFlow_10thj54</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_19h465p</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_0ueh6ud" name="c42" implementation="c42">
      <bpmn2:incoming>SequenceFlow_15zijhp</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_19puzgo</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:exclusiveGateway id="ExclusiveGateway_1t02161">
      <bpmn2:incoming>SequenceFlow_1eu52fa</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_15zijhp</bpmn2:outgoing>
      <bpmn2:outgoing>SequenceFlow_10thj54</bpmn2:outgoing>
    </bpmn2:exclusiveGateway>
    <bpmn2:sequenceFlow id="SequenceFlow_15zijhp" sourceRef="ExclusiveGateway_1t02161" targetRef="ServiceTask_0ueh6ud">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">\${Math.random() &lt; 0.3}</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="SequenceFlow_10thj54" sourceRef="ExclusiveGateway_1t02161" targetRef="ServiceTask_1p86a2s">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">\${Math.random() &lt; 0.7}</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
    <bpmn2:sequenceFlow id="SequenceFlow_1eu52fa" sourceRef="ServiceTask_0x25rub" targetRef="ExclusiveGateway_1t02161" />
    <bpmn2:endEvent id="EndEvent_01b7fnf">
      <bpmn2:incoming>SequenceFlow_19h465p</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_19h465p" sourceRef="ServiceTask_1p86a2s" targetRef="EndEvent_01b7fnf" />
    <bpmn2:endEvent id="EndEvent_14ymp1a">
      <bpmn2:incoming>SequenceFlow_19puzgo</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_19puzgo" sourceRef="ServiceTask_0ueh6ud" targetRef="EndEvent_14ymp1a" />
  </bpmn2:process>
</bpmn2:definitions>`;
let pd = null;
ProcessDefinition.from(processDef, {
  a: async (states) => states.a = 1,
  b: async (states) => states.b = 2,
  c1: async (states) => states.c1 = states.a + states.b,
  c2: async (states) => states.c2 = states.a - states.b,
  c3: async (states) => states.c3 = states.a * states.b,
  c4: async (states) => states.c4 = states.a / states.b,
  c41: async (states) => states.c40 = states.c4 + states.b,
  c42: async (states) => states.c40 = states.c4 - states.b,
  d: async (states) => states.d = states.c1 + states.c2,
  e: async (states) => states.result = states.c3 + states.d,
}).then((_pd) => {
  pd = _pd;
  console.log('process loaded!');
});
logger.setLevel(Logger.LEVEL_INFO);

router.post('/:bpId/versions/:version/run', function (req, res, next) {
  if (!pd) {
    return res.status(500).send('process is still loading');
  }
  try {
    const states = new ProcessRunStates();
    ProcessRun.from(pd, states)
      .start()
      .then((states) => {
        res.status(200).send(`${states.result}`);
      })
      .catch((err) => {
        logger.error('exception found: ', err);
        res.status(500).send(err.message);
      });
  } catch (err) {
    logger.error('exception found: ', err);
    res.status(500).send(err.message);
  }
});


router.route('/')
  .all(function (req, res, next) {
    // runs for all HTTP verbs first
    // think of it as route specific middleware!
    next()
  })
  .get(function (req, res, next) {
    store.getAll()
      .then(result => res.status(200).json(result))
      .catch(err => {
        logger.error('error when get process', err);
        res.status(500).json({message: err.message})
      });
  })
  .put(function (req, res, next) {
    store.update(req.body.content, req.body.script)
      .then(result => res.status(200).json(result))
      .catch(err => {
        logger.error('error when put process', err);
        res.status(500).json({message: err.message})
      });
  })
  .post(function (req, res, next) {
    store.exists(req.body.content)
      .then(exists => {
        if (exists) {
          return res.status(409).json({message: 'process exists'});
        } else {
          return store.add(req.body.content, req.body.script)
            .then(result => res.status(200).json(result))
            .catch(err => {
              logger.error('error when create process', err);
              res.status(500).json({message: err.message})
            });
        }
      })
      .catch(err => {
        logger.error('error when create process', err);
        res.status(500).json({message: err.message});
      });
  });

module.exports = {
  router: router,
  setStore: setStore
};
