import { APIRequestContext, APIResponse } from '@playwright/test';

const SPACE_CONFIGURATIONS_ENDPOINT = '/api/v3/space_configurations';

export class APIActions {
    constructor(private readonly request: APIRequestContext) {}

    async getSpaceConfigurations(
        listingId?: string | number,
        accessToken?: string
    ): Promise<APIResponse> {
        return this.request.get(SPACE_CONFIGURATIONS_ENDPOINT, {
            params:
                listingId === undefined
                    ? {}
                    : { listing_id: listingId.toString() },

            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
        });
    }
}
