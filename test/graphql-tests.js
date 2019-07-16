'use strict';
const {GraphQLClient} = require('graphql-request');
const _ = require('lodash');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const {server} = require('../server');
const url = 'http://localhost:4000/';
const uuidv4 = require('uuid/v4');
const {createFakeUser} = require('./devHelper');
const config = require('../config');

const {getCollection, updateCollection, getItemFromCollection} = require('../data/index');
const serverConfig = {serverUrl: 'http://localhost:4000/', subscriptionUrl: 'ws://localhost:4000/graphql'};
let graphQLClient;
before(() => {
    graphQLClient = new GraphQLClient(serverConfig.serverUrl, {
        headers: {
            authorization: `${config.ACCESS_TOKEN}`,
        },
    });
});

after(() => {
    server.stop();
});

describe('GraphQL Basic Tests', () => {
    it('Can page through persons', (done) => {
        let colOne = [];
        let colTwo =[];
        let query = `{
                  persons{
                    collection{
                      firstName
                      lastName
                      knowsConnection{
                        edges{
                          node{
                            firstName
                            lastName
                          }
                        }
                      }
                    }
                    pageInfo{
                      hasNextPage
                      endCursor
                    }
                  }
                }`;
        graphQLClient.request(query)
            .then(data => {
                console.log(data);
                expect(data.persons.collection.length).to.equal(10);
                colOne = data.persons.collection;
                let query = `{
                  persons(paginationSpec: {after: "${data.persons.pageInfo.endCursor}"}){
                    collection{
                      firstName
                      lastName
                      knowsConnection{
                        edges{
                          node{
                            firstName
                            lastName
                          }
                        }
                      }
                    }
                    pageInfo{
                      hasNextPage
                      endCursor
                    }
                  }
                }`;
                graphQLClient.request(query)
                    .then(data =>{
                        expect(data.persons.collection.length).to.equal(10);
                        colTwo = data.persons.collection;
                        const rslt = _.intersection(colOne, colTwo);
                        expect(rslt.length).to.equal(0);
                        done();
                    });
            })
    });



    it('Can get movies from API length equals Movies from data length', (done) => {
        const movies = getCollection('movies');
        const query = `query { movies{ title releaseDate } }`;
        graphQLClient.request(query)
            .then(data => {
                console.log(data);
                expect(movies.length).to.equal(data.movies.length);
                done();
            })
    });


    it('Can paginate likes', (done) => {
        const query = `{
            persons{
                    collection{
                      firstName
                      lastName
                    }
                }
            }`;
        graphQLClient.request(query)
            .then(data => {
                expect(data.persons.collection.length).to.equal(10); // 10 is the default page size
                done();
            })
            .catch(e =>{
                console.log(e);
                done(e);
            })
    });

    it('Can add person via GraphQL', (done) => {
        const {firstName, lastName, dob} = createFakeUser();
        const query = `mutation{
            addPerson(person: {firstName: "${firstName}", lastName: "${lastName}", dob: "${dob}"}){
                id
                firstName
                lastName
                dob
            }
        }`;
        graphQLClient.request(query)
            .then(data => {
                console.log(data);
                const obj = data.addPerson;
                expect(obj.firstName).to.equal(firstName);
                expect(obj.lastName).to.equal(lastName);
                expect(obj.dob).to.equal(dob);
                const persons = getCollection('persons');
                const p = _.find(persons, {id:obj.id });
                console.log(process.env.PERSONS)
                expect(obj.id).to.equal(p.id);
                done();
            })
            .catch(e =>{
                done(e)
            })
    });
});