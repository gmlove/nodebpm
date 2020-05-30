var express = require('express');
var router = express.Router();
const { ProcessDefinition, ProcessRun, ProcessRunStates } = require('../bpm/engine');
const FileSystemStore = require('../bpm/store').FileSystemStore;
const { Logger, logger } = require('../bpm/logger');


let store = new FileSystemStore('./data');
function setStore(_store) {
  store = _store;
}

logger.setLevel(Logger.LEVEL_INFO);


router.param('bp_id', function (req, res, next, id) {
  req.bpId = id;
  next()
});

router.param('version', function (req, res, next, version) {
  try {
    req.bpVersion = parseInt(version);
  } catch (err) {
    return res.status(500).json({message: `version must be an integer`});
  }
  next()
});

router.post('/test', function (req, res, next) {
  store.test(req.body.content, req.body.script, req.body.data)
    .then(states => res.status(200).json({result: states.result}))
    .catch((err) => {
      logger.error('exception found: ', err);
      res.status(500).json({message: err.message});
    });
});

router.post('/:bp_id/versions/:version/run', function (req, res, next) {
  try {
    store.loadBp(req.bpId, req.bpVersion)
      .then(bp => {
        const states = new ProcessRunStates();
        if (req.body.data) {
          try {
            states.init(req.body.data);
          } catch (err) {
            return res.status(500).json({message: err.message});
          }
        }

        return ProcessRun.from(bp, states)
          .start()
          .then((states) => {
            res.status(200).json({id: req.bpId, version: req.bpVersion, result: states.result});
          });
      })
      .catch((err) => {
        logger.error('exception found: ', err);
        res.status(500).json({message: err.message});
      });
  } catch (err) {
    logger.error('exception found: ', err);
    res.status(500).json({message: err.message});
  }
});


router.route('/:bp_id')
  .get(function (req, res, next) {
    const id = req.bpId;
    store.get(id)
      .then(result => res.status(200).json(result))
      .catch(err => {
        logger.error('error when get process', err);
        res.status(500).json({message: err.message})
      });
  });


router.route('/:bp_id/versions/:version')
  .get(function (req, res, next) {
    const id = req.bpId, version = req.bpVersion;
    store.get(id, version)
      .then(result => {
        if (result.length == 0) {
          res.status(404).json({message: 'not found'});
        } else if (result.length > 1) {
          res.status(500).json({message: 'unexpected error'});
        } else {
          res.status(200).json(result[0]);
        }
      })
      .catch(err => {
        logger.error('error when get process', err);
        res.status(500).json({message: err.message})
      });
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
