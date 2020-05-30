

class Logger {

    constructor(level) {
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    debug(msg) {
        if (this.level <= Logger.LEVEL_DEBUG) {
            console.debug(`[${new Date().toISOString()}] [DEBUG]: ${msg}`);
        }
    }

    info(msg) {
        if (this.level <= Logger.LEVEL_INFO) {
            console.info(`[${new Date().toISOString()}] [INFO]: ${msg}`);
        }
    }

    error(msg, err) {
        if (this.level <= Logger.LEVEL_ERROR) {
            console.error(`[${new Date().toISOString()}] [ERROR]: ${msg}`, err);
        }
    }

}

Logger.LEVEL_DEBUG = 0;
Logger.LEVEL_INFO = 1;
Logger.LEVEL_ERROR = 2;


const logger = new Logger(Logger.LEVEL_DEBUG);


module.exports = {
    logger: logger,
    Logger: Logger,
}
