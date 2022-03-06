const { Database } = require('./index.js');

const benchmarks = {};
function benchmarkStart (name) {
    benchmarks[name] = performance.now();
}
function benchmarkEnd (name, operations) {
    let ms = performance.now() - benchmarks[name];
    let s = Math.ceil((ms / 1000) * 1000) / 1000;
    if (ms < 1000) console.log(`${name}: ${Math.ceil(ms * 1000) / 1000}ms`);
    else console.log(`${name}: ${s}s`);
    if (operations) console.log(`${' '.repeat(name.length + 1)} ${(
        Math.ceil(Math.floor(operations / (ms / 1000)) * 1000) / 1000
    ).toLocaleString()} operations/s`);
    delete benchmarks[name];
    return ms;
}

const db = Database.create();


function centralized (times) {
    benchmarkStart('Test: Write Single File ' + times);
    for (let i = 0; i < times; i++) {
        db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });
    }
    benchmarkEnd('Test: Write Single File ' + times, times);

    benchmarkStart('Test: Read Single File ' + times);
    (db.collection('single').findAll());
    benchmarkEnd('Test: Read Single File ' + times, times);

    benchmarkStart('Test: Delete Single File ' + times);
    db.collection('single').clear();
    benchmarkEnd('Test: Delete Single File ' + times, times);
}

db.collection('single').clear();

let { _id } = db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });

console.log(db.collection('single').findOne({ $equals: { _id } }))
console.log('\n');