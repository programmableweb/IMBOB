'use strict';
const expect = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const helper = require('./devHelper');

const {getCollection, updateCollection, getItemFromCollection, saveCollection} = require('../data/index');

describe('Utility Tools', () => {
    it('add emails', (done) => {
        const persons = getCollection('persons');
        helper.addEmailToPerson(persons);
        saveCollection('persons', persons).then((result) =>{
            done();
        });
    });
});