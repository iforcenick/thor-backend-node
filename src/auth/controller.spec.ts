import 'chai-http';
import chai from 'chai';
import 'mocha';
import * as server from '../../test/server';
const expect = chai.expect;

chai.use(require('chai-http'));

describe('Auth password change', () => {
    before(async () => {
        server.start();
    });

    after(async () => {
        await server.stop();
    });

    it('should return 401 when no auth header is present', async () => {
        const res = await chai.request(server.app).get('/auth/password');
        expect(res).have.status(401);
    });
});