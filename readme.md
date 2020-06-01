# Nodebpm

*High performance workflow driven dynamic process engine.*

---

+ Workflow modeler: https://github.com/gmlove/activiti-modeling-app
+ Activiti: https://www.activiti.org/
+ Development discussions and bugs reports are on the [issue tracker](https://github.com/gmlove/nodebpm/issues).

---

Nodebpm is a full functional micro service to support high performance graph based task scheduling. The task graph is defined by a bpmn version 2 protocol and could be designed by [activiti modeler](https://github.com/gmlove/activiti-modeling-app).

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

- POST `/`: create a process.
- PUT `/`: create a new version for an existing process.
- GET `/`: query the existing processes.
- GET `/:process-id`: get the existing process by id.
- GET `/:process-id/versions/:version`: get the existing process by id and version.
- POST `/:process-id/versions/:version/run`: run a process.
- POST `/test`: run a test against some new process.

Detailed usage about these APIs could be found in the [test cases](https://github.com/gmlove/nodebpm/blob/master/routes/bp.spec.js).

# Licensing
Unless otherwise stated, the source code are licensed under the [Apache 2.0 License](./LICENSE).