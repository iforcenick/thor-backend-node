import 'reflect-metadata';

import * as sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha';
import {Auth, AuthType} from './auth/models';
import {Types} from './user/role/models';
import {ServiceContext} from 'typescript-rest';
const {mockRequest} = require('mock-req-res');
chai.use(chaiAsPromised);

export let sandbox;
export {sinon, chai};

export const contractorTenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
export const contractorId = '8251efb9-18b5-476e-a2a0-27e38a4da750';
export const adminTenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
export const adminId = '7f11b5b2-c9f8-4e3f-920d-0248daaa216e';
export const systemId = '1d86de60-3d88-4207-9531-4a630c1998e9';
export const systemTenantId = 'SYSTEM_TENANT';

export const getMockedServiceContext = (): ServiceContext => {
    const serviceContext = new ServiceContext();
    serviceContext.request = mockRequest();
    return serviceContext;
};

export const setAnonymousAuth = (serviceContext) => {
    const auth = new Auth();
    serviceContext.request.auth = auth;
    return auth;
};

export const setContractorAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = contractorId;
    auth.tenantId = contractorTenantId;
    auth.roles = [Types.contractor];
    serviceContext.request.auth = auth;
    return auth;
};

export const setAdminAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = adminId;
    auth.tenantId = adminTenantId;
    auth.roles = [Types.admin];
    serviceContext.request.auth = auth;
    return auth;
};

export const setAdminReaderAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = adminId;
    auth.tenantId = adminTenantId;
    auth.roles = [Types.adminReader];
    serviceContext.request.auth = auth;
    return auth;
};

export const setSystemAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.SYSTEM;
    auth.userId = systemId;
    auth.tenantId = systemTenantId;
    auth.roles = [Types.admin];
    serviceContext.request.auth = auth;
    return auth;
};

beforeEach(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});