import 'reflect-metadata';
import {Container} from 'typescript-ioc';
import {AddTenantLogic} from '../../tenant/logic';
import {Config} from '../../config';
import {Model} from 'objection';

const logic: AddTenantLogic = Container.get(AddTenantLogic);
const config: Config = Container.get(Config);
const knex = require('knex');

const addTenant = async (name, email) => {
    if (!name) {
        console.log('Name is empty');
        process.exit(1);
    }
    if (!email) {
        console.log('Email is empty');
        process.exit(1);
    }
    const _knex = knex(config.get('db'));
    Model.knex(_knex);
    try {
        const tenant = await logic.execute(name, email);
        console.log(tenant);
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
    process.exit(0);
};
const name = process.argv.slice(2)[0];
const email = process.argv.slice(2)[1];


addTenant(name, email).then();