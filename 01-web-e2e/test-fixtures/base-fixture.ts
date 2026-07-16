import { test as base } from '@playwright/test';

import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { CreateListingPage } from '../pages/createListingPage/create-listing.page';
import { ListingsPage } from '../pages/listings.page';

type MyFixtures = {
    homePage: HomePage;
    loginPage: LoginPage;
    createListingPage: CreateListingPage;
    listingsPage: ListingsPage;
};

export const test = base.extend<MyFixtures>({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    createListingPage: async ({ page }, use) => {
        await use(new CreateListingPage(page));
    },
    listingsPage: async ({ page }, use) => {
        await use(new ListingsPage(page));
    },
});

export { expect } from '@playwright/test';
