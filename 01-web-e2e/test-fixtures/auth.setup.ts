import { test as setup, expect } from './base-fixture';
import { authFile } from './auth-file';

setup('authenticate', async ({ page, loginPage, homePage }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables.'
        );
    }

    await loginPage.goto();
    await loginPage.login(email, password);

    await expect(homePage.myAccountButton).toBeVisible();

    await page.context().storageState({ path: authFile });
});
