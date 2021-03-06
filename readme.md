# Nodebpm

*High performance workflow driven dynamic process engine.*

---

+ Workflow modeler: https://github.com/gmlove/activiti-modeling-app
+ Activiti: https://www.activiti.org/
+ Development discussions and bugs reports are on the [issue tracker](https://github.com/gmlove/nodebpm/issues).

---

Nodebpm is a full functional micro service to support high performance graph based task scheduling. The task graph is defined by a bpmn version 2 protocol and could be designed by [activiti modeler](https://github.com/gmlove/activiti-modeling-app).

Run a simple performance testing, and we could get around 1000 rps under just one node process.

![performance](doc/perf.png)

The tasks below are supported right now:

- Start Event
- End Event
- Service Task
- Parallel Gateway
- Exclusive Gateway

Most of other kind of tasks are not designed to be automatically executed, so no support right now.

# Usage

A demo has been deployed to heroku (Thanks heroku.com!), and you can try a online one [here](https://node-bpm.herokuapp.com/).

The related `activiti modeler` has been deployed [here](https://node-bpm-modeler.herokuapp.com/).

For testing, run

```shell
npm run test
```

For starting the service, run

```shell
npm start
```

Then open [http://localhost:3000/](http://localhost:3000/), and have a try.

A modified `activiti modeler` can be used to design the workflows, which could be found [here](https://github.com/gmlove/activiti-modeling-app). The main changes are: 1. auth removed; 2. pre-defined some mock data. With the modified version, you can start the modeler quickly without other activiti components. But please be noted that all the persistence related functionality are not supported since it is now a pure frontend app.

# API

- POST `/bp/`: create a process.
- PUT `/bp/`: create a new version for an existing process.
- GET `/bp/`: query the existing processes.
- GET `/bp/:process-id`: get the existing process by id.
- GET `/bp/:process-id/versions/:version`: get the existing process by id and version.
- POST `/bp/:process-id/versions/:version/run`: run a process.
- POST `/bp/test`: run a test against some new process.

Detailed usage about these APIs could be found in the [test cases](https://github.com/gmlove/nodebpm/blob/master/routes/bp.spec.js).

# Licensing
Unless otherwise stated, the source code are licensed under the [Apache 2.0 License](./LICENSE).