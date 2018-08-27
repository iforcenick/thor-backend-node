import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {UserResponse} from '../user/models';
import {TenantResponse} from '../tenant/models';

export class Rank extends db.Model {
    static tableName = db.Tables.ranks;
}

export class RankBaseInfo extends Mapper {
}

export class RankResponse extends RankBaseInfo {
    userId: string = mapper.FIELD_STR;
    rank: string = mapper.FIELD_STR;
}

mapper.registerRelation(RankResponse, 'user', new mapper.Relation(UserResponse));
mapper.registerRelation(RankResponse, 'tenant', new mapper.Relation(TenantResponse));

export interface PaginatedRankResponse extends PaginatedResponse {
    items: Array<RankResponse>;
}
