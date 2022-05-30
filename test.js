const { Database } = require('./index.js');

// const benchmarks = {};
// function benchmarkStart (name) {
//     benchmarks[name] = performance.now();
// }
// function benchmarkEnd (name, operations) {
//     let ms = performance.now() - benchmarks[name];
//     let s = Math.ceil((ms / 1000) * 1000) / 1000;
//     if (ms < 1000) console.log(`${name}: ${Math.ceil(ms * 1000) / 1000}ms`);
//     else console.log(`${name}: ${s}s`);
//     if (operations) console.log(`${' '.repeat(name.length + 1)} ${(
//         Math.ceil(Math.floor(operations / (ms / 1000)) * 1000) / 1000
//     ).toLocaleString()} operations/s`);
//     delete benchmarks[name];
//     return ms;
// }

const db = Database.create();


// function centralized (times) {
//     benchmarkStart('Test: Write Single File ' + times);
//     for (let i = 0; i < times; i++) {
//         db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });
//     }
//     benchmarkEnd('Test: Write Single File ' + times, times);

//     benchmarkStart('Test: Read Single File ' + times);
//     (db.collection('single').findAll());
//     benchmarkEnd('Test: Read Single File ' + times, times);

//     benchmarkStart('Test: Delete Single File ' + times);
//     db.collection('single').clear();
//     benchmarkEnd('Test: Delete Single File ' + times, times);
// }

// db.collection('single').clear();
// db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });
// db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });

// let { _id } = db.collection('single').insertOne({ key: 'value', anotherKey: 'anotherValue' });

// console.log(db.collection('single').findOne({ $equals: { _id } }));
// (db.collection('single').updateOne({ $equals: { _id } }, { key: 'notValue' }))
// console.log(db.collection('single').findOne({ $equals: { _id } }));
// console.log('\n');

// db.collection('single').deleteOne({ $equals: { _id } })

const collection = db.collection('test');
collection.insertMany([
    { key: 'value', anotherKey: 'anotherValue', i: 0 },
    { key: 'value', anotherKey: 'anotherValue', i: 1 },
    { key: 'value', anotherKey: 'anotherValue', i: 2 },
    { key: 'value', anotherKey: 'anotherValue', i: 3 },
    { key: 'value', anotherKey: 'anotherValue', i: 4 },
    { key: 'value', anotherKey: 'anotherValue', i: 5 },
    { key: 'value', anotherKey: 'anotherValue', i: 6 },
    { key: 'value', anotherKey: 'anotherValue', i: 7 }
]);
collection.deleteOne({ i: 0 });
collection.deleteOne({ $equals: { i: 4 } });
console.log(collection.findAll());
collection.collectGarbage();
console.log(collection.findAll());
collection.deleteAll();
