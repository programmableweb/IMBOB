'use strict';
const expect = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const admin = require('../admin');

const {getCollection, updateCollection, getItemFromCollection, saveCollection} = require('../data/index');

describe('User Test', () => {
    it('can login and validate', (done) => {
        const user = getCollection('users')[0];
        admin.login(user.username, user.password)
            .then((token) => {
                expect(token).to.be.a('string');
                const result = admin.validateToken(token);
                expect(result.data.username).to.equal(user.username);
                expect(result.data.scopes).to.an('array');
                expect(result.data.scopes.length).to.equal(user.scopes.length);
                done();
            }).catch((e) => {
                done(e)
        })
    });
});