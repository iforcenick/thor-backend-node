const uuidv4 = require('uuid/v4');

export const tokenExtractor = (req, res, next): void => {
    const header = req.header('Authorization');

    if (header) {
        req.userToken = header.replace('Bearer ', '');
    }

    next();
};

export const authExtractor = (req, res, next): void => {
    req.tenantId = req.user.tenantProfile.tenantId;
};

export const requestId = (req, res, next): void => {
    req.requestId = uuidv4();
};

export const correlationId = (req, res, next): void => {
    let correlation = req.get('X-Correlation-ID');
    if (!correlation) {
        correlation = uuidv4();
    }

    req.correlationId = correlation;
};