import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page
      .getByText('Email', { exact: true })
      .locator('xpath=..')
      .getByRole('textbox');
    // Password field has the same broken for/id pairing as email.
    this.passwordInput = page
      .getByText('Password', { exact: true })
      .locator('xpath=..')
      .locator('input');
    this.signInButton = page.getByRole('button', {
      name: /sign in|log in/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/users/sign_in', { waitUntil: 'domcontentloaded' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
