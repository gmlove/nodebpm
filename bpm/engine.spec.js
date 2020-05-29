const { ProcessDefinition, ProcessRunStates } = require('./engine');
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
        const result = await pd.run(states)
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
            <bpmn2:serviceTask id="ServiceTask_1s6d5g9" name="c1" implementation="c">
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
            c: async (states) => states.result = states.a + states.b,
            d: async (states) => states.result = states.a - states.b
        });
        const states = new ProcessRunStates();
        const result = await pd.run(states)
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

    it('should load bpmn files and run a flow with parallel gateway', () => {

    })

})
