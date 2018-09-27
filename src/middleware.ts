import * as context from './context';
const createNamespace = require('continuation-local-storage').createNamespace;
const authContext = createNamespace(context.Type.auth);
const requestContext = createNamespace(context.Type.request);
const uuidv4 = require('uuid/v4');

export const tokenExtractor = (req, res, next): void => {
    const header = req.header('Authorization');

    if (header) {
        req.userToken = header.replace('Bearer ', '');
    }

    next();
};

export const authExtractor = (req, res, next): void => {
    authContext.bindEmitter(req);
    authContext.bindEmitter(res);

    authContext.run(() => {
        if (req.user) {
            authContext.set('tenant', req.user.tenantProfile.tenantId);
            authContext.set('user', req.user);
        }

        next();
    });
};

export const requestId = (req, res, next): void => {
    requestContext.bindEmitter(req);
    requestContext.bindEmitter(res);

    requestContext.run(() => {
        const requestId = uuidv4();
        requestContext.set('requestId', requestId);
        req.requestId = requestId;

        next();
    });
};

export const correlationId = (req, res, next): void => {
    requestContext.bindEmitter(req);
    requestContext.bindEmitter(res);

    requestContext.run(() => {
        let correlation = req.get('X-Correlation-ID');
        if (!correlation) {
            correlation = uuidv4();
        }

        requestContext.set('correlationId', correlation);

        next();
    });
};