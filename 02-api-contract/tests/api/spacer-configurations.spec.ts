import { test, expect } from '../../test-fixtures/api-fixture';
import { getAccessToken } from '../../utils/auth';
import { expectValidSpacerConfiguration } from '../../utils/spacer-configuration-assertions';
import {
    ApiErrorResponse,
    SpacerConfiguration,
} from '../../types/spacer-configuration';

test.describe('GET /api/v3/space_configurations', () => {
    let validListingId: number;

    test.beforeAll(() => {
        const listingId = process.env.VALID_LISTING_ID;

        if (!listingId) {
            throw new Error(
                'Missing VALID_LISTING_ID environment variable.'
            );
        }

        validListingId = Number(listingId);

        if (!Number.isInteger(validListingId)) {
            throw new Error(
                'VALID_LISTING_ID must be a valid integer.'
            );
        }
    });

    // Cases that don't require a real access token — grouped separately so
    // an OAuth token endpoint outage (getAccessToken failing in the describe
    // below) can't skip these too. They only need the endpoint to reject an
    // absent/bogus Authorization header correctly.
    test.describe('when unauthenticated', () => {
        test('returns 401 when Bearer token is missing', async ({
            apiActions,
        }) => {
            const response = await apiActions.getSpaceConfigurations(
                validListingId
            );

            expect(response.status()).toBe(401);

            const body: ApiErrorResponse = await response.json();

            expect(body).toEqual({
                error: 'token_missing',
                error_description: 'No Bearer token provided',
            });
        });

        test('returns 401 when Bearer token is invalid', async ({
            apiActions,
        }) => {
            const response = await apiActions.getSpaceConfigurations(
                validListingId,
                'definitely-not-a-valid-token'
            );

            expect(response.status()).toBe(401);

            const body: ApiErrorResponse = await response.json();

            expect(body).toEqual({
                error: 'invalid_token',
                error_description: 'Token is invalid',
            });
        });
    });

    // Cases that need a real access token from getAccessToken(). If the
    // OAuth token endpoint is down, only this group fails/skips — the
    // unauthenticated cases above are unaffected.
    test.describe('when authenticated', () => {
        let accessToken: string;

        test.beforeAll(async ({ request }) => {
            accessToken = await getAccessToken(request);
        });

        test('returns 200 and valid space configurations for an authorized listing', async ({
            apiActions,
        }) => {
            const response = await apiActions.getSpaceConfigurations(
                validListingId,
                accessToken
            );

            expect(
                response.status(),
                `Unexpected response: ${await response.text()}`
            ).toBe(200);

            const body: SpacerConfiguration[] = await response.json();

            // Contract says the response is a bare JSON array.
            expect(Array.isArray(body)).toBeTruthy();

            for (const configuration of body) {
                expectValidSpacerConfiguration(configuration);

                // Every returned configuration must belong to the requested listing.
                expect(configuration.listing_id).toBe(validListingId);
            }
        });

        test('returns 400 when listing_id is missing', async ({
            apiActions,
        }) => {
            const response = await apiActions.getSpaceConfigurations(
                undefined,
                accessToken
            );

            expect(response.status()).toBe(400);

            const body: ApiErrorResponse = await response.json();

            expect(body).toEqual({
                error: 'listing_id is missing',
            });
        });

        test('returns 400 when listing_id is not an integer', async ({
            apiActions,
        }) => {
            const response = await apiActions.getSpaceConfigurations(
                'invalid',
                accessToken
            );

            expect(response.status()).toBe(400);

            const body: ApiErrorResponse = await response.json();

            expect(body).toEqual(
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });

        test('returns 404 when listing does not exist', async ({
            apiActions,
        }) => {
            const nonExistentListingId = 999999999;

            const response = await apiActions.getSpaceConfigurations(
                nonExistentListingId,
                accessToken
            );

            expect(response.status()).toBe(404);

            const body: ApiErrorResponse = await response.json();

            expect(body).toEqual({
                error: 'Listing not found',
            });
        });
    });
});
