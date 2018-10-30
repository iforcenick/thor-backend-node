import {Mapper} from '../mapper';
import {mapper} from '../api';


export class BeneficialOwnerAddress extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;

}

export class BeneficialOwnerBaseModel extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    @mapper.object(BeneficialOwnerAddress)
    address: BeneficialOwnerAddress = new BeneficialOwnerAddress();
}

export class AddBeneficialOwnerResponse extends BeneficialOwnerBaseModel {
    id: string = mapper.FIELD_STR;
}

export class AddBeneficialOwnerRequest extends BeneficialOwnerBaseModel {
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
}