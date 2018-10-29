import {AddBeneficialOwnerRequest, AddBeneficialOwnerResponse, BeneficialOwnerAddress} from '../beneficialOwner/models';
import * as dwolla from '../dwolla';
import {AutoWired} from 'typescript-ioc';

@AutoWired
export class AddBeneficialOwnerTransaction {

    private dwollaClient: dwolla.Client;

    async Execute(request: AddBeneficialOwnerRequest): Promise<AddBeneficialOwnerResponse> {
       return new AddBeneficialOwnerResponse();
    }
}