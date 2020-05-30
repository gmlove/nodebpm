const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');
const vm = require('vm');
const { ProcessDefinition } = require('./engine');
const { logger } = require('./logger');

const parser = new xml2js.Parser();


class Bp {
    constructor(id, version, content, script) {
        this.id = id;
        this.version = version;
        this.content = content;
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
        this.scriptContext = vm.createContext({});
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
        return new vm.Script(`(function() {return ${script};})()`).runInContext(this.scriptContext);
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

        await fs.promises.writeFile(path.join(this.basePath, `${id}-${formatVersion(currentVersion + 1)}.bpmn20.xml`), xmlContent);
        await fs.promises.writeFile(path.join(this.basePath, `${id}-${formatVersion(currentVersion + 1)}.script.js`), script);
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

        await fs.promises.writeFile(path.join(this.basePath, `${id}-${formatVersion(1)}.bpmn20.xml`), xmlContent);
        await fs.promises.writeFile(path.join(this.basePath, `${id}-${formatVersion(1)}.script.js`), script);
        return new Bp(id, 1, xmlContent, script);
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
