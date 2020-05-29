const { ProcessDefinition, ProcessRun, ProcessRunStates } = require('./engine');
const expect = require('chai').expect;

describe('bpm', () => {

    it('should load bpmn files and run a simple flow', async () => {
        const processDef = `
        <?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="automation" isExecutable="true">
    <bpmn2:documentation />
    <bpmn2:startEvent id="StartEvent_1">
      <bpmn2:outgoing>SequenceFlow_1k98z8o</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_1k98z8o" sourceRef="StartEvent_1" targetRef="ServiceTask_0em0nmt" />
    <bpmn2:sequenceFlow id="SequenceFlow_1ltlcxk" sourceRef="ServiceTask_0em0nmt" targetRef="ServiceTask_0tt533q" />
    <bpmn2:sequenceFlow id="SequenceFlow_04gcty3" sourceRef="ServiceTask_0tt533q" targetRef="ServiceTask_1s6d5g9" />
    <bpmn2:endEvent id="EndEvent_0gn4cv2">
      <bpmn2:incoming>SequenceFlow_1ytdgjc</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_1ytdgjc" sourceRef="ServiceTask_1s6d5g9" targetRef="EndEvent_0gn4cv2" />
    <bpmn2:serviceTask id="ServiceTask_0em0nmt" name="a" implementation="a">
      <bpmn2:incoming>SequenceFlow_1k98z8o</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1ltlcxk</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_0tt533q" name="b" implementation="b">
      <bpmn2:incoming>SequenceFlow_1ltlcxk</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_04gcty3</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:serviceTask id="ServiceTask_1s6d5g9" name="c" implementation="c">
      <bpmn2:incoming>SequenceFlow_04gcty3</bpmn2:incoming>
      <bpmn2:outgoing>SequenceFlow_1ytdgjc</bpmn2:outgoing>
    </bpmn2:serviceTask>
  </bpmn2:process>
</bpmn2:definitions>
        `;
        const pd = await ProcessDefinition.from(processDef, {
            a: async (states) => states.a = 1,
            b: async (states) => states.b = 2,
            c: async (states) => states.result = states.a + states.b
        });
        const states = new ProcessRunStates();
        const result = await ProcessRun.from(pd, states)
            .start()
            .then((states) => {
                return states.result;
            })
            .catch((err) => {
                console.log('exception found: ', err);
            });
        console.log('states: ', states);
        console.log('result: ', result);
        expect(result).to.eq(3);
    })

    it('should load bpmn files and run a flow with exclusive gateway', async () => {
        const processDef = `
        <?xml version="1.0" encoding="UTF-8"?>
        <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
          <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="automation-with-exgateway" isExecutable="true">
            <bpmn2:documentation />
            <bpmn2:startEvent id="StartEvent_1">
              <bpmn2:outgoing>SequenceFlow_1k98z8o</bpmn2:outgoing>
            </bpmn2:startEvent>
            <bpmn2:sequenceFlow id="SequenceFlow_1k98z8o" sourceRef="StartEvent_1" targetRef="ServiceTask_0em0nmt" />
            <bpmn2:sequenceFlow id="SequenceFlow_1ltlcxk" sourceRef="ServiceTask_0em0nmt" targetRef="ServiceTask_0tt533q" />
            <bpmn2:endEvent id="EndEvent_0gn4cv2">
              <bpmn2:incoming>SequenceFlow_05ukdnz</bpmn2:incoming>
            </bpmn2:endEvent>
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
              <bpmn2:outgoing>SequenceFlow_05ukdnz</bpmn2:outgoing>
            </bpmn2:serviceTask>
            <bpmn2:exclusiveGateway id="ExclusiveGateway_0e6mfrn">
              <bpmn2:incoming>SequenceFlow_0s9rdg1</bpmn2:incoming>
              <bpmn2:outgoing>SequenceFlow_1nms7xk</bpmn2:outgoing>
              <bpmn2:outgoing>SequenceFlow_1snyf24</bpmn2:outgoing>
            </bpmn2:exclusiveGateway>
            <bpmn2:sequenceFlow id="SequenceFlow_0s9rdg1" sourceRef="ServiceTask_0tt533q" targetRef="ExclusiveGateway_0e6mfrn" />
            <bpmn2:sequenceFlow id="SequenceFlow_1nms7xk" sourceRef="ExclusiveGateway_0e6mfrn" targetRef="ServiceTask_1s6d5g9">
              <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">\${Math.random() &lt; 0.8 &amp;&amp; a == 1}</bpmn2:conditionExpression>
            </bpmn2:sequenceFlow>
            <bpmn2:sequenceFlow id="SequenceFlow_05ukdnz" sourceRef="ServiceTask_1s6d5g9" targetRef="EndEvent_0gn4cv2" />
            <bpmn2:sequenceFlow id="SequenceFlow_1snyf24" sourceRef="ExclusiveGateway_0e6mfrn" targetRef="ServiceTask_1vtal80">
              <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression">\${Math.random() &lt;= 0.2}</bpmn2:conditionExpression>
            </bpmn2:sequenceFlow>
            <bpmn2:serviceTask id="ServiceTask_1vtal80" name="c2" implementation="c2">
              <bpmn2:incoming>SequenceFlow_1snyf24</bpmn2:incoming>
              <bpmn2:outgoing>SequenceFlow_07iim8p</bpmn2:outgoing>
            </bpmn2:serviceTask>
            <bpmn2:endEvent id="EndEvent_0i3gmlp">
              <bpmn2:incoming>SequenceFlow_07iim8p</bpmn2:incoming>
            </bpmn2:endEvent>
            <bpmn2:sequenceFlow id="SequenceFlow_07iim8p" sourceRef="ServiceTask_1vtal80" targetRef="EndEvent_0i3gmlp" />
          </bpmn2:process>
        </bpmn2:definitions>
        `;
        const pd = await ProcessDefinition.from(processDef, {
            a: async (states) => states.a = 1,
            b: async (states) => states.b = 2,
            c1: async (states) => states.result = states.a + states.b,
            c2: async (states) => states.result = states.a - states.b
        });
        const states = new ProcessRunStates();
        const result = await ProcessRun.from(pd, states)
            .start()
            .then((states) => {
                return states.result;
            })
            .catch((err) => {
                console.log('exception found: ', err);
            });
        console.log('states: ', states);
        console.log('result: ', result);
        expect(result).to.be.oneOf([3, -1]);
    });

    it('should load bpmn files and run a flow with parallel gateway', async () => {
        const processDef = `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="automation-with-pargateway" isExecutable="true">
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
      <bpmn2:outgoing>SequenceFlow_1xec8b8</bpmn2:outgoing>
    </bpmn2:serviceTask>
    <bpmn2:endEvent id="EndEvent_0yldn2n">
      <bpmn2:incoming>SequenceFlow_1xec8b8</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="SequenceFlow_1xec8b8" sourceRef="ServiceTask_0xjfg6v" targetRef="EndEvent_0yldn2n" />
  </bpmn2:process>
</bpmn2:definitions>`;
        const pd = await ProcessDefinition.from(processDef, {
            a: async (states) => states.a = 1,
            b: async (states) => states.b = 2,
            c1: async (states) => states.c1 = states.a + states.b,
            c2: async (states) => states.c2 = states.a - states.b,
            d: async (states) => states.result = states.c1 + states.c2,
        });
        const states = new ProcessRunStates();
        const result = await ProcessRun.from(pd, states)
            .start()
            .then((states) => {
                return states.result;
            })
            .catch((err) => {
                console.log('exception found: ', err);
            });
        console.log('states: ', states);
        console.log('result: ', result);
        expect(result).to.be.eq(2);

    })

    it('should load bpmn files and run a flow with gateways', async () => {
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
        const pd = await ProcessDefinition.from(processDef, {
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
        });
        const states = new ProcessRunStates();
        const result = await ProcessRun.from(pd, states)
            .start()
            .then((states) => {
                return states.result;
            })
            .catch((err) => {
                console.log('exception found: ', err);
            });
        console.log('states: ', states);
        console.log('result: ', result);
        expect(result).to.be.eq((1 * 2) + ((1 + 2) + (1 - 2)));
    })

})
