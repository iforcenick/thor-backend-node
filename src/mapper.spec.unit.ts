import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import {Container} from 'typescript-ioc';
import 'mocha';
import {sandbox} from './test-setup.spec.unit';
import {mapper} from './api';
import {Mapper} from './mapper';
import * as _ from 'lodash';

chai.use(chaiAsPromised);
const expect = chai.expect;

class WrappedDeeper extends Mapper {
    field: string = mapper.FIELD_STR;
    missing: string = mapper.FIELD_STR;
}

class Wrapped extends Mapper {
    field: string = mapper.FIELD_STR;
    @mapper.object(WrappedDeeper)
    wrapped: WrappedDeeper = new WrappedDeeper();
}

class Wrapper extends Mapper {
    test: string = mapper.FIELD_STR;
    missing: string = mapper.FIELD_STR;
    @mapper.object(Wrapped)
    wrapped: Wrapped = new Wrapped();
}

class WrappedDeeperArray extends Mapper {
    field: string = mapper.FIELD_STR;
    @mapper.object(WrappedDeeper)
    wrapped: WrappedDeeper = new WrappedDeeper();
}

class WrappedArray extends Mapper {
    field: string = mapper.FIELD_STR;
    @mapper.array(WrappedDeeperArray)
    wrapped: Array<WrappedDeeperArray> = [];
}

class WrapperWithArray extends Mapper {
    test: string = mapper.FIELD_STR;
    @mapper.array(WrappedArray)
    wrapped: Array<WrappedArray> = [];
}

const map = (mapper, data) => {
    return new mapper().map(data);
};

describe('Mapper', () => {
    describe('nested mapping', () => {
        it('should map nested objects', async () => {
            const expected = {
                test: 'test',
                missing: null,
                wrapped: {
                    field: 'test',
                    wrapped: {
                        missing: null,
                        field: 'test2',
                    }
                }
            };
            const input = _.cloneDeep(expected);
            input['test2'] = 'test';
            input.wrapped['field1'] = 'test';
            input.wrapped.wrapped['field1'] = 'test';

            const output = map(Wrapper, input);
            expect(output).to.deep.equal(expected);
        });

        it('should map nested object if it is null', async () => {
            const expected = {
                test: 'test',
                missing: null,
                wrapped: null
            };
            const input = _.cloneDeep(expected);
            input['test2'] = 'test';

            const output = map(Wrapper, input);
            expect(output).to.deep.equal(expected);
        });

        it('should map array of nested objects', async () => {
            const expected = {
                test: 'test',
                wrapped: [
                    {
                        field: 'test',
                        wrapped: [
                            {
                                field: 'testFirst',
                                wrapped: null,
                            },
                            {
                                field: 'testSecond',
                                wrapped: null,
                            },
                        ]
                    },
                    {
                        field: 'test',
                        wrapped: [],
                    },
                ]
            };
            const input = _.cloneDeep(expected);
            input.wrapped[0]['field2'] = 'test2';
            input.wrapped[1]['field2'] = 'test2';
            input.wrapped[0]['wrapped'][0]['field2'] = 'test2';

            const output = map(WrapperWithArray, input);
            expect(output).to.deep.equal(expected);
        });
    });
});
