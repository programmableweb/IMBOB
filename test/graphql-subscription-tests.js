'use strict';
const {GraphQLClient} = require('graphql-request');
const _ = require('lodash');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const {server} = require('../server');
const faker = require('faker');
const {createFakeUser} = require('./devHelper');

const {getCollection, updateCollection, getItemFromCollection} = require('../data/index');

const ws = require('ws');
const {WebSocketLink} = require("apollo-link-ws");
const {execute} = require("apollo-link");
const {SubscriptionClient} = require('subscriptions-transport-ws');
const gql = require('graphql-tag');
const serverConfig = {serverUrl: 'http://localhost:4000/', subscriptionUrl: 'ws://localhost:4000/graphql'};
const config = require('../config');

let link;


before(() => {
    const client = new SubscriptionClient(
        serverConfig.subscriptionUrl,
        {
            reconnect: true,
            connectionParams: () => ({
                    authorization: config.ACCESS_TOKEN,
            }),
        },
        ws,
    );

    link = new WebSocketLink(client);
});

after(() => {
    link.subscriptionClient.close();
    server.stop();
});

describe('GraphQL Subscription Tests', () => {
    /*
    This test sends a path via the mutiation, ping and
    asserts the the path submitted in the mutation shows
    up in event to which the test is subscribed
     */
    it('Can ping and subscribe', (done) => {
        let body = faker.lorem.words(3);
        const operation = {
            query: gql`
                subscription onEventAdded{
                    onEventAdded{
                        id
                        name
                        body
                        createdAt
                        storedAt
                    }
                }`
        };

        execute(link, operation).subscribe({
            next: data => {
                console.log(`received data: ${JSON.stringify(data, null, 2)}`);
                expect(data.data.onEventAdded.body).to.equal(body);
                done();
            },
            error: error => {
                console.log(`received error ${JSON.stringify(error)}`)
            },
            complete: () => console.log(`complete`),
        });

        const query = `mutation{
                  ping(messageBody: "${body}"){
                    createdAt
                    body
                    name
                    id
                  }
                }`;

        const graphQLClient = new GraphQLClient(serverConfig.serverUrl, {
            headers: {
                authorization: `${config.ACCESS_TOKEN}`,
            },
        });
        const data = graphQLClient.request(query)
            .then(data => {
                expect(data).to.be.an('object');
                expect(data.ping.body).to.equal(body);
            });
    });

    it('Can AddPerson and subscribe', (done) => {
        const {firstName, lastName, dob} = createFakeUser();
        const operation = {
            query: gql`
                subscription onPersonAdded{
                    onPersonAdded{
                        id
                        name
                        body
                        createdAt
                        storedAt
                    }
                }`
        };

        execute(link, operation).subscribe({
            next: data => {
                console.log(`received data: ${JSON.stringify(data, null, 2)}`);
                const rslt = JSON.parse(data.data.onPersonAdded.body);
                expect(rslt.firstName).to.equal(firstName);
                expect(rslt.lastName).to.equal(lastName);
                expect(rslt.dob).to.equal(dob);
                done();
            },
            error: error => {
                console.log(`received error ${JSON.stringify(error)}`)
            },
            complete: () => console.log(`complete`),
        });


        const query = `mutation{
                     addPerson(person: {firstName: "${firstName}",
                     lastName: "${lastName}",
                     dob: "${dob}"}){
                        id
                        firstName
                        lastName
                        dob
                      }
                    }`;

        const graphQLClient = new GraphQLClient(serverConfig.serverUrl, {
            headers: {
                authorization: `${config.ACCESS_TOKEN}`,
            },
        });
        const data = graphQLClient.request(query)
            .then(data => {
                expect(data).to.be.an('object');
                //expect(data.ping.body).to.equal(body);
            });
    });
});