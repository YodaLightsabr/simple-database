const fs = require('fs');
const path = require('path');
let counter = 0;

function update (original, modifier) {
    for (const modificationName in modifier) {
        let modification = modifier[modificationName];
        if (modification && modification.constructor && modification.constructor.name === 'Object') {
            if (original[modificationName] && original[modificationName].constructor && original[modificationName].constructor.name === 'Object') {
                original[modificationName] = update(original[modificationName], modification);
            } else {
                original[modificationName] = modification;
            }
        } else {
            original[modificationName] = modification;
        }
    }
    return original;
}

function base10toHex (str) { // .toString(16) only works up to 2^53
    let dec = str.toString().split(''), sum = [], hex = [], i, s;
    while (dec.length) {
        s = 1 * dec.shift();
        for(let i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10;
            sum[i] = s % 16;
            s = (s - sum[i]) / 16;
        }
    }
    while (sum.length) {
        hex.push(sum.pop().toString(16));
    }
    return hex.join('');
}

function generateId () {
    counter += 1;
    let uuid = Date.now() + '';
    uuid += ((Math.round(((Math.round(performance.now() * 100) / 100) % 1) * 100)) + '').padStart(2, '0') + '';
    uuid += (process.pid + '').padStart(6, '0');
    uuid += (Math.floor(1 * Math.random() * 1000000) + '').substring(0, 6);
    uuid += counter % 10;
    uuid = base10toHex(uuid.padEnd(30, '0').substring(0, 30));
    console.log({ uuid, counter });
    return uuid;
}

class Database {
    constructor (dirPath) {
        this.path = dirPath;
	if (!fs.existsSync(dirPath)) {
  console.log('\x1b[1m\x1b[36m\n *** .simpledb directory not found; creating... *** \n\x1b[0m');
           fs.mkdirSync(dirPath);
           fs.writeFileSync(path.join(dirPath, 'meta.json'), '{}', 'utf8');
           console.log('\x1b[1m\x1b[36m *** created .simpledb *** \n\x1b[0m');
           console.log('\x1b[1m\x1b[31m *** it is strongly recommended that you add .simpledb to your .gitignore file *** \n\x1b[0m');
       } 
       if (!fs.existsSync(path.join(dirPath, 'meta.json'))) throw new Error('Missing meta.json');
    }
    collection (name) {
        const collection = new Collection(name, this);
        if (!fs.existsSync(collection.path)) {
            fs.mkdirSync(collection.path);
            fs.writeFileSync(path.join(collection.path, 'meta.json'), `{"length":0}`, 'utf8');
        }
        return collection;
    }
    collections () {
        return fs.readdirSync(this.path).filter(file => file !== 'meta.json').map(collection => new Collection(collection, this));
    }
    static create (dirPath) {
        return new Database(dirPath ?? path.join(__dirname, '.simpledb'));
    }
}

class Util {
    constructor () {

    }
    static generateId () {
        return generateId();
    }
    static update (a, b) {
        return update(a, b);
    }
}

class DatabaseQuery {
    constructor (query = {}) {
        this.query = query;
        if (typeof query !== 'object') throw new Error('Query must be an object');
    }
    test (entry) {
        if (entry == null || entry === 0) return false;
        if (this.query.$equals) for (let key in this.query.$equals) {
            if (entry[key] !== this.query.$equals[key]) return false;
        }
        if (this.query.$filter) for (let key in this.query.$filter) {
            if (this.query.$filter(entry) == false) return false;
        }
        return true;
    }
}

class Collection {
    constructor (name, database) {
        this.name = name;
        this.database = database;
    }
    get path () {
        return path.join(this.database.path, this.name);
    }
    findAll () {
        return this.findMany({});
    }
    findMany (query) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        let results = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) results.push(entry);
        }
        return results;
    }
    findOne (query) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) return entry;
        }
        return null;
    }
    deleteOne (query) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) {
                let pos = data.indexOf(entry);
                let file = Math.floor(pos / 1000);
                let index = pos % 1000;
                let fileData = JSON.parse(fs.readFileSync(path.join(this.path, `${file}.json`), 'utf8'));
                fileData[index] = 0;
                fs.writeFileSync(path.join(this.path, `${file}.json`), JSON.stringify(fileData), 'utf8');
                return;
            }
        }
        return null;
    }
    deleteMany (query) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) {
                let pos = data.indexOf(entry);
                let file = Math.floor(pos / 1000);
                let index = pos % 1000;
                let fileData = JSON.parse(fs.readFileSync(path.join(this.path, `${file}.json`), 'utf8'));
                fileData[index] = 0;
                fs.writeFileSync(path.join(this.path, `${file}.json`), JSON.stringify(fileData), 'utf8');
            }
        }
        return null;
    }
    updateOne (query, doc) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) {
                let pos = data.indexOf(entry);
                let file = Math.floor(pos / 1000);
                let index = pos % 1000;
                let fileData = JSON.parse(fs.readFileSync(path.join(this.path, `${file}.json`), 'utf8'));
                fileData[index] = update(fileData[index], doc);
                fs.writeFileSync(path.join(this.path, `${file}.json`), JSON.stringify(fileData), 'utf8');
                return;
            }
        }
        return null;
    }
    updateMany (query, doc) {
        if (!(query instanceof DatabaseQuery)) query = new DatabaseQuery(query);
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.ceil(length / 1000);
        let data = [];
        for (let i = 0; i < files; i++) {
            data.push(...JSON.parse(fs.readFileSync(path.join(this.path, `${i}.json`), 'utf8')));
        }
        for (const entry of data) {
            if (query.test(entry)) {
                let pos = data.indexOf(entry);
                let file = Math.floor(pos / 1000);
                let index = pos % 1000;
                let fileData = JSON.parse(fs.readFileSync(path.join(this.path, `${file}.json`), 'utf8'));
                fileData[index] = update(fileData[index], doc);
                fs.writeFileSync(path.join(this.path, `${file}.json`), JSON.stringify(fileData), 'utf8');
            }
        }
        return null;
    }
    insertOne (doc) {
        if (!doc._id) doc._id = generateId();
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.floor(length / 1000);
        if (Math.floor((length + 1) / 1000) === Math.floor((length) / 1000) + 1) {
            files++;
        }
        length++;
        if (!fs.existsSync(path.join(this.path, `${files}.json`))) {
            fs.writeFileSync(path.join(this.path, `${files}.json`), JSON.stringify([doc]), 'utf8');
        } else {
            fs.writeFileSync(path.join(this.path, `${files}.json`), JSON.stringify([
                ...JSON.parse(fs.readFileSync(path.join(this.path, `${files}.json`), 'utf8')),
                doc
            ]), 'utf8');
        }
        fs.writeFileSync(path.join(this.path, 'meta.json'), JSON.stringify({ length }), 'utf8');
        return doc;
    }
    insertMany (docs) {
        let meta = JSON.parse(fs.readFileSync(path.join(this.path, 'meta.json'), 'utf8'));
        let { length } = meta;
        let files = Math.floor(length / 1000);
        for (const doc of docs) {
            if (!doc._id) doc._id = generateId();
            if (Math.floor((length + 1) / 1000) === Math.floor((length) / 1000) + 1) {
                files++;
            }
            length++;
            if (!fs.existsSync(path.join(this.path, `${files}.json`))) {
                fs.writeFileSync(path.join(this.path, `${files}.json`), JSON.stringify([doc]), 'utf8');
            } else {
                fs.writeFileSync(path.join(this.path, `${files}.json`), JSON.stringify([
                    ...JSON.parse(fs.readFileSync(path.join(this.path, `${files}.json`), 'utf8')),
                    doc
                ]), 'utf8');
            }
        }
        fs.writeFileSync(path.join(this.path, 'meta.json'), JSON.stringify({ length }), 'utf8');
        return docs;
    }
    clear () {
        fs.rmSync(path.join(this.database.path, this.name), { recursive: true });
        fs.mkdirSync(path.join(this.database.path, this.name));
        fs.writeFileSync(path.join(this.path, 'meta.json'), '{"length":0}', 'utf8');
    }
    deleteAll () {
        return this.clear();
    }
    collectGarbage () {
        const docs = this.findAll();
        this.deleteAll();
        this.insertMany(docs);
    }
}

class FileCollection extends Collection {
    constructor (name, database) {
        super(name, database);
    }
    findAll () {
        return fs.readdirSync(path.join(this.database.path, this.name)).map(file => {
            return JSON.parse(fs.readFileSync(path.join(this.database.path, this.name, file), 'utf8'));
        });
    }
    write (doc) {
        let docs = fs.readdirSync(path.join(this.database.path, this.name));
        fs.writeFileSync(path.join(this.database.path, this.name, docs.length + '.json'), JSON.stringify(doc), 'utf8');
    }
    clear () {
        fs.rmSync(path.join(this.database.path, this.name), { recursive: true });
        fs.mkdirSync(path.join(this.database.path, this.name));
    }
}

module.exports = { Database, Collection, FileCollection, Util, DatabaseQuery };
