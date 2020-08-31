import {
    Action,
    BaseResource,
    SessionProxy
} from 'cfn-rpdk';
import { ResourceModel } from './models';
import { S3Control, STS } from 'aws-sdk'
import { WrapHandler, ResourceProviderHandler, HandlerArgs } from './common';
import { PutPublicAccessBlockRequest, DeletePublicAccessBlockRequest } from 'aws-sdk/clients/s3control';

const UpsertAccountPublicAccessBlockHandler: ResourceProviderHandler<S3Control> = async (action: Action, args: HandlerArgs, service: S3Control)  => {
    const model = args.request.desiredResourceState;

    const accountId = args.request.awsAccountId;

    const request: PutPublicAccessBlockRequest = {
        AccountId: accountId,
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: model.blockPublicAcls,
            IgnorePublicAcls: model.ignorePublicAcls,
            BlockPublicPolicy: model.blockPublicPolicy,
            RestrictPublicBuckets: model.restrictPublicBuckets
        }
    };

    console.info({ action, message: 'before invoke putPublicAccessBlock', request });
    const response = await service.putPublicAccessBlock(request).promise();
    console.info({ action, message: 'after invoke putPublicAccessBlock', response });

    model.resourceId = accountId;

    console.info({action, message: 'done', model});
}

const DeletePublicAccountBlockHandler: ResourceProviderHandler<S3Control> = async (action: Action, args: HandlerArgs, service: S3Control)  => {

    const request: DeletePublicAccessBlockRequest = {
        AccountId: args.request.awsAccountId
    };

    console.info({ action, message: 'before invoke deletePublicAccessBlock', request });
    const response = await service.deletePublicAccessBlock(request).promise();
    console.info({ action, message: 'after invoke deletePublicAccessBlock', response });

    console.info({action, message: 'done'});
}

const EmptyHandler: ResourceProviderHandler<S3Control> = async (action: Action, args: HandlerArgs, service: S3Control)  => {
    console.info({action, message: 'not implemented'});
    return Promise.resolve();
};


class Resource extends BaseResource<ResourceModel> { }

const resource = new Resource(ResourceModel.TYPE_NAME, ResourceModel);
resource.addHandler(Action.Create, WrapHandler(Action.Create, 'S3Control', UpsertAccountPublicAccessBlockHandler));
resource.addHandler(Action.Update, WrapHandler(Action.Update, 'S3Control', UpsertAccountPublicAccessBlockHandler));
resource.addHandler(Action.Delete, WrapHandler(Action.Delete, 'S3Control', DeletePublicAccountBlockHandler));
resource.addHandler(Action.List, WrapHandler(Action.List, 'S3Control', EmptyHandler));
resource.addHandler(Action.Read, WrapHandler(Action.Read, 'S3Control', EmptyHandler));

export const entrypoint = resource.entrypoint;

export const testEntrypoint = resource.testEntrypoint;