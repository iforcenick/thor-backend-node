import {GET, Path} from 'typescript-rest';
import {BaseController} from '../api';
import {Tags} from 'typescript-rest-swagger';
import * as os from 'os';

const getRepoInfo = require('git-repo-info');
const osUtils = require('os-utils');


@Tags('monitoring')
@Path('/')
export class MonitoringController extends BaseController {
    @GET
    @Path('')
    async health() {
        const testHeader = this.getRequestContext().getHeader('X-Test');
        const info = getRepoInfo();
        return {
                build: {
                    version: this.config.get('build.version'),
                    branch: info.branch,
                    commit: info.sha,
                    tag: info.tag,
                },
                resources: {
                    memory: {
                        total: osUtils.totalmem(),
                        free: osUtils.freemem(),
                        freePercent: osUtils.freememPercentage(),
                        usage: process.memoryUsage(),
                    },
                    cpu: os.cpus(),
                    systemUptime: osUtils.sysUptime(),
                    processUptime: osUtils.processUptime(),
                    averageLoad: osUtils.loadavg(1),
                },
                running: true,
                headerXTest: testHeader,
            };
    }
}
