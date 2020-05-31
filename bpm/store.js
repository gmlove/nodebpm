const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');
const vm = require('vm');
const { ProcessDefinition, ProcessRun, ProcessRunStates } = require('./engine');
const { logger } = require('./logger');

const parser = new xml2js.Parser();


class Bp {
    constructor(id, version, content, script) {
        this.id = id;
        this.version = version;
        this.content = content;
        this.script = script;
    }

    setContent(content) {
        this.content = content;
    }

    setScript(script) {
        this.script = script;
    }
}

class BpVersions {
    constructor(id, versions) {
        this.id = id;
        this.versions = versions;
    }

    withVersionSorted() {
        this.versions = this.versions.sort();
        return this;
    }
}


function formatVersion(ver) {
    ver = new String(ver);
    return ver.length < 6 ? '0'.repeat(6 - ver.length) + ver : ver;
}


class FileSystemStore {

    constructor(basePath) {
        this.basePath = basePath;
        this.scriptContext = vm.createContext({ fetch: require('node-fetch') });
        this.loadedBps = {};
    }

    async loadBp(id, version) {
        const pbKey = `${id}-${version}`;
        if (pbKey in this.loadedBps) {
            return this.loadedBps[pbKey];
        }
        const bp = await fs.promises.readFile(this._bpPath(id, version), {encoding: 'utf-8'});
        const script = await fs.promises.readFile(this._bpScriptPath(id, version), {encoding: 'utf-8'});

        const funcs = this._evalScript(script);
        this.loadedBps[pbKey] = await ProcessDefinition.from(bp, funcs);
        return this.loadedBps[pbKey];
    }

    async _bps() {
        const files = await fs.promises.readdir(this.basePath);
        const bps = [];
        for (const fileName of files) {
            const isFile = (await fs.promises.stat(path.join(this.basePath, fileName))).isFile();
            if (isFile && fileName.match(/^.*-[0-9]+\.bpmn20\.xml$/)) {
                const matches = fileName.match(/^(.*)-([0-9]+)\.bpmn20\.xml$/);
                const id = matches[1], version = parseInt(matches[2]);
                bps.push(new Bp(id, version));
            }
        }
        return bps;
    }

    async _bpId(xmlContent) {
        const bp = await parser.parseStringPromise(xmlContent);
        return bp['bpmn2:definitions']['bpmn2:process'][0].$.name;
    }

    _evalScript(script) {
        script = script.trim();
        return new vm.Script(`(function() {${ script.substring(0, 1) === '{' ? 'return' : '' } ${script};})()`).runInContext(this.scriptContext);
    }

    _bpPath(id, version) {
        return path.join(this.basePath, `${id}-${formatVersion(version)}.bpmn20.xml`);
    }

    _bpScriptPath(id, version) {
        return path.join(this.basePath, `${id}-${formatVersion(version)}.script.js`);
    }

    async getAll() {
        const bps = await this._bps();
        const bpMap = {};
        bps.forEach(bp => {
                if (bp.id in bpMap) {
                    bpMap[bp.id].versions.push(bp.version);
                } else {
                    bpMap[bp.id] = new BpVersions(bp.id, [bp.version]);
                }
            });

        return Object.keys(bpMap).sort()
            .map(id => bpMap[id].withVersionSorted());
    }

    async get(id, version) {
        let bps = await this._bps();
        bps = bps.filter(bp => bp.id === id);
        if (version) {
            bps = bps.filter(bp => bp.version === parseInt(version))
        }
        for (const bp of bps) {
            bp.setContent(await fs.promises.readFile(this._bpPath(bp.id, bp.version), {encoding: 'utf-8'}));
            bp.setScript(await fs.promises.readFile(this._bpScriptPath(bp.id, bp.version), {encoding: 'utf-8'}));
        }
        return bps;
    }

    async update(xmlContent, script) {
        const id = await this._bpId(xmlContent);
        const bps = await this._bps();
        const existBps = bps.filter(bp => bp.id === id).sort((a, b) => a.version - b.version);

        if(existBps.length == 0) {
            throw new Error(`process ${id} not exists`);
        }

        const currentVersion = existBps[existBps.length - 1].version;

        const funcs = this._evalScript(script);

        await ProcessDefinition.validate(xmlContent, funcs)
            .catch(err => Promise.reject(`process validation error: ${err.message}`));

        await fs.promises.writeFile(this._bpPath(id, currentVersion + 1), xmlContent);
        await fs.promises.writeFile(this._bpScriptPath(id, currentVersion + 1), script);
        return new Bp(id, currentVersion + 1, xmlContent, script);
    }

    async add(xmlContent, script) {
        const id = await this._bpId(xmlContent);
        const bps = await this._bps();

        if(bps.find(bp => bp.id === id)) {
            throw new Error(`process ${id} exists`);
        }

        const funcs = this._evalScript(script);

        await ProcessDefinition.validate(xmlContent, funcs)
            .catch(err => Promise.reject(`process validation error: ${err.message}`));

        await fs.promises.writeFile(this._bpPath(id, 1), xmlContent);
        await fs.promises.writeFile(this._bpScriptPath(id, 1), script);
        return new Bp(id, 1, xmlContent, script);
    }

    async test(xmlContent, script, data) {
        const id = await this._bpId(xmlContent);
        const funcs = this._evalScript(script);

        const states = new ProcessRunStates();
        if (data) {
            states.init(data);
        }

        const bp = await ProcessDefinition.from(xmlContent, funcs);
        return await ProcessRun.from(bp, states).start();
    }

    async exists(xmlContent) {
        const id = await this._bpId(xmlContent);
        const bps = await this._bps();

        return !!bps.find(bp => bp.id === id);
    }
}

module.exports = {
    FileSystemStore: FileSystemStore
};
