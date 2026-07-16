import { test as base } from '@playwright/test';

import { APIActions } from '../utils/api-actions';

type APIFixtures = {
    apiActions: APIActions;
};

export const test = base.extend<APIFixtures>({
    apiActions: async ({ request }, use) => {
        const apiActions = new APIActions(request);
        await use(apiActions);
    },
});

export { expect } from '@playwright/test';