const fs = require('fs');
const util = require('util');
const path = require('path');
const _  = require('lodash');

const fileToObject =  async (filename) => {
    const filespec = path.join(__dirname, filename);
    const readFile = util.promisify(fs.readFile);
    const result = await readFile(filespec,"utf8").then(data => {
        return JSON.parse(data)
    });
    return result;
};

const initGlobalData = ()=>{

}

const objectToFile = async (filespec, data) =>{
    const writeFile = util.promisify(fs.writeFile);
    return await writeFile(filespec, data,"utf8");
}

const getItemFromCollection = (collectionName, itemId) =>{
    const collection = getCollection(collectionName);
    const item = _.find(collection, {id: itemId});
    return item;

}

const fileToObjectSync =  (filename) => {
    const filespec = path.join(__dirname, filename);
    return fs.readFileSync(filespec,"utf8");
};

const getCollectionConfigSync = (collectionName) =>{
    const holder = {};
    switch(collectionName.toUpperCase()){
        case 'MOVIES':
            holder.filename = 'movies.json';
            holder.env = 'MOVIES';
            break;
        case 'PERSONS':
            holder.filename = 'persons.json';
            holder.env = 'PERSONS';
            break;
        case 'TRIPLES':
            holder.filename = 'triples.json';
            holder.env = 'TRIPLES';
            break;
    };

    return holder;
};

const saveCollection = async (collectionName, collection)=>{
    const holder = getCollectionConfigSync(collectionName);
    const data = JSON.stringify(collection);
    let filespec = path.join(__dirname, holder.filename);
    await objectToFile(filespec, data);
    const rtn = await fileToObject(holder.filename);
    process.env[holder.env] = JSON.stringify(rtn);
};

const getCollection = (collectionName) =>{
    switch(collectionName.toUpperCase()){
        case 'MOVIES':
            if(!process.env.MOVIES)process.env.MOVIES = fileToObjectSync('movies.json');
            return JSON.parse(process.env.MOVIES);
        case 'PERSONS':
            if(!process.env.PERSONS)process.env.PERSONS = fileToObjectSync('persons.json');
            return JSON.parse(process.env.PERSONS);
        case 'TRIPLES':
            if(!process.env.TRIPLES)process.env.TRIPLES = fileToObjectSync('triples.json');
            const arr = JSON.parse(process.env.TRIPLES);
            arr.forEach(a => a.createdAt = new Date(a.createdAt));
            return arr;
    }
};

const initGlobalDataSync = ()=>{
    getCollection('movies');
    getCollection('persons');
    getCollection('triples');
};

const updateCollection =  async function(dataObj, collectionName){
    const holder = getCollectionConfigSync(collectionName);
    let filespec = path.join(__dirname, holder.filename);
    //get the current data file
    let arr = await fileToObject(holder.filename);
    if(collectionName.toUpperCase()=== 'MOVIES'){
        // we need to treat movies differently, pull the movie out
        const buffer = _.remove(arr, (itm) =>{
            return itm.id === dataObj.id;
        });
    }
    //put the movie with its new data back in
    arr.push(dataObj);
    const data = JSON.stringify(arr);
    await objectToFile(filespec, data);
    const rtn = await fileToObject(holder.filename);
    process.env[holder.env] = JSON.stringify(rtn);
    //process.env[holder.env] = data;
    return dataObj;
};

const replaceCollection =  async function(dataObj, collectionName){
    const holder = {};
    switch(collectionName.toUpperCase()){
        case 'MOVIES':
            holder.filename = 'movies.json';
            break;
        case 'PERSONS':
            holder.filename = 'persons.json';
            break;
        case 'TRIPLES':
            holder.filename = 'triples.json';
            break;
    }
    let filespec = path.join(__dirname, holder.filename);
    await objectToFile(filespec, data);
    return data;
    const data = JSON.stringify(dataObj);
};


module.exports = {
    replaceCollection,
    updateCollection,
    getCollection,
    getItemFromCollection,
    initGlobalDataSync,
    saveCollection
}