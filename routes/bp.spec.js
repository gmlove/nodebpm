const expect = require('chai').expect;
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const port = 29001;


function url(path) {
    path = path.substring(0, 1) == '/' ? path.substring(1) : path;
    return `http://localhost:${port}/bp/${path}`;
}

describe('bp', () => {
    let server = null;

    before(async () => {
        const express = require('express');
        const logger = require('morgan');
        const http = require('http');
        const bpModule = require('./bp');
        const app = express();
        app.use(logger('dev'));
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use('/bp', bpModule.router);

        server = http.createServer(app);

        await new Promise((resolve, reject) => {
            server.listen(port);
            server.on('error', (err) => {
                console.log('error found when start test server', err);
                reject(err);
            });
            server.on('listening', () => {
                console.log(`test server running on port: ${port}`);
                resolve();
            });
        });

        const testDataDir = path.join('test', 'routes', 'bp.spec');
        testDataDirExists = await fs.promises.stat(testDataDir).catch(e => false);
        await fs.promises.mkdir(testDataDir, {recursive: true});
        await fs.promises.readdir(testDataDir)
            .then(files => Promise.all(files.map(file => fs.promises.unlink(path.join(testDataDir, file)))));
        const FileSystemStore = require('../bpm/store').FileSystemStore;
        bpModule.setStore(new FileSystemStore(testDataDir));
    });

    after(() => {
        if (server) {
            server.close();
        }
    });

    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
      <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="some-bp" isExecutable="true">
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
    `
    const script = `{
        a: async (states) => states.a = 1,
        b: async (states) => states.b = 2,
        c: async (states) => states.result = states.a + states.b
    }`

    it('should create/update/list/get processes', async () => {
        let resp = await fetch(url('/'), { method: 'POST', body: JSON.stringify({ content: content, script: script }), headers: { 'Content-Type': 'application/json' } });
        let respJson = await resp.json();
        expect(resp.status).to.be.eq(200);
        console.log(respJson);
        expect(respJson.id).to.be.eq('some-bp');
        expect(respJson.version).to.be.eq(1);
        expect(respJson.content.trim()).to.be.eq(content.trim());

        resp = await fetch(url('/'), { method: 'POST', body: JSON.stringify({ content: content, script: script }), headers: { 'Content-Type': 'application/json' } });
        expect(resp.status).to.be.eq(409);

        resp = await fetch(url('/'), { method: 'PUT', body: JSON.stringify({ content: content, script: script }), headers: { 'Content-Type': 'application/json' } });
        expect(resp.status).to.be.eq(200);
        respJson = await resp.json();
        console.log(respJson);
        expect(respJson.id).to.be.eq('some-bp');
        expect(respJson.version).to.be.eq(2);

        content1 = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
          <bpmn2:process id="process-255576e8-4c96-4911-b19b-1cdb33e6c421" name="another-bp" isExecutable="true">
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
        `
        resp = await fetch(url('/'), { method: 'POST', body: JSON.stringify({ content: content1, script: script }), headers: { 'Content-Type': 'application/json' } });
        expect(resp.status).to.be.eq(200);

        resp = await fetch(url('/'));
        expect(resp.status).to.be.eq(200);
        respJson = await resp.json();
        console.log(respJson);
        expect(respJson).to.be.deep.eq([
            { id: 'another-bp', versions: [1] },
            { id: 'some-bp', versions: [1, 2] },
        ]);

        resp = await fetch(url('/some-bp'));
        expect(resp.status).to.be.eq(200);
        respJson = await resp.json();
        console.log(respJson);
        expect(respJson).to.be.deep.eq([
            { id: 'some-bp', version: 1, content: content, script: script },
            { id: 'some-bp', version: 2, content: content, script: script },
        ]);

        resp = await fetch(url('/some-bp/versions/1'));
        expect(resp.status).to.be.eq(200);
        respJson = await resp.json();
        console.log(respJson);
        expect(respJson).to.be.deep.eq({ id: 'some-bp', version: 1, content: content, script: script });

        resp = await fetch(url('/some-bp/versions/1/run'), { method: 'POST', body: JSON.stringify({ states: { a: 3 } }), headers: { 'Content-Type': 'application/json' } });
        expect(resp.status).to.be.eq(200);
        respJson = await resp.json();
        console.log(respJson);
        expect(respJson).to.be.deep.eq({ id: 'some-bp', version: 1, result: 3 });
    })

    it('should be able to test', async () => {
        let resp = await fetch(url('/test'), { method: 'POST', body: JSON.stringify({ content: content, script: script }), headers: { 'Content-Type': 'application/json' } });
        let respJson = await resp.json();
        expect(resp.status).to.be.eq(200);
        console.log(respJson);
        expect(respJson).to.be.deep.eq({ result: 3 });
    })
})
