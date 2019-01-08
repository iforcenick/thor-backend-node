import {Exchanges, Routing} from '../worker/exchanges';
import {IMessage} from '../worker/publisher';

export abstract class EmailMessage implements IMessage {
    readonly exchange: Exchanges = Exchanges.emails;
    readonly abstract payload: any;
    readonly abstract routingKey: string;
}


export class SendInvitationEmailMessage extends EmailMessage {
    constructor(private to: string, private invitationLink: string, private companyName: string) {
        super();
    }
    readonly routingKey: string = Routing.contractors.invitationSend;
    readonly payload: any = {
        to: this.to,
        invitationLink: this.invitationLink,
        companyName: this.companyName,
    };
}