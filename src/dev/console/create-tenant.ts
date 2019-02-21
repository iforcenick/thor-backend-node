import 'reflect-metadata';
import Joi = require('joi');
import {Model} from 'objection';
import {Container} from 'typescript-ioc';
import {Config} from '../../config';
import {AddTenantLogic} from '../../tenant/logic';

const logic: AddTenantLogic = Container.get(AddTenantLogic);
const config: Config = Container.get(Config);
const knex = require('knex');

const addTenant = async (name, email, settings) => {
    const emailSchema = Joi.object().keys({
        email: Joi.string().required().email(),
    });

    const nameSchema = Joi.object().keys({
        name: Joi.string().required(),
    });

    const settingsSchema = Joi.object().keys({
        settings: Joi.object(),
    });

    const validationNameResult = Joi.validate(name, Joi.string().required());
    if (validationNameResult.error) {
        console.log('name', validationNameResult.error);
        process.exit(1);
    }
    const validationEmailResult = Joi.validate(email, Joi.string().required().email());
    if (validationEmailResult.error) {
        console.log('email', validationEmailResult.error);
        process.exit(1);
    }

    const _knex = knex(config.get('db'));
    Model.knex(_knex);
    try {
        const tenant = await logic.execute(name, email, settings);
        console.log(tenant);
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
    process.exit(0);
};
const name = process.argv.slice(2)[0];
const email = process.argv.slice(2)[1];

addTenant(name, email, {}).then();
