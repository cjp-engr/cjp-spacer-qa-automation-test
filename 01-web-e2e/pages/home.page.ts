import { Page, Locator } from '@playwright/test';

export class HomePage {
    readonly page: Page;
    readonly signInButton: Locator;
    readonly myAccountButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.signInButton = page.getByRole('link', { name: 'Sign In' });
        this.myAccountButton = page.getByRole('button', { name: 'My Account' });
    }

    async clickSignIn(): Promise<void> {
        await this.signInButton.click();

    }

}
