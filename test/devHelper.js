const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const faker = require('faker');

const createFakeUser = () => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const dob = faker.date.between('1950-01-01', '2001-12-31').toISOString().slice(0, 10);

    return {firstName, lastName, dob};

}

const addEmailToPerson = (collection) => {
    collection.forEach((obj) =>{
        if(!obj.email){
            const email = `${obj.firstName}.${obj.lastName}@${faker.internet.domainName()}`;
            obj.email = email;
        }
    });
};

const convertIntIdToGuid = (collection) =>{
    collection.forEach((itm)=>{
        for(const prop in itm){
            if(prop === 'id'){
                itm[prop] = uuidv4();
            }
        }
        console.log(JSON.stringify(itm));
    });
    return collection;
};

const guidTriples = (trips, persons) =>{
    const trips2 = [];
    persons.forEach((person) => {

        const itms = _.filter(trips, {subject: {firstName: person.firstName, lastName: person.lastName}});


        const rslt = itms.map((t) => {
            t.subject.id = person.id;
            trips2.push(t)
        });
    });
    trips2.forEach((t) => {
        const p = _.find(persons, {firstName: t.object.firstName, lastName: t.object.lastName});
        t.object.id = p.id;
    })
    return trips2;
};

module.exports = {convertIntIdToGuid, guidTriples, createFakeUser, addEmailToPerson};
