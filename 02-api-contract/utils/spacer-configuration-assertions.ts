import { expect } from '@playwright/test';
import { SpacerConfiguration } from '../types/spacer-configuration';

export function expectValidSpacerConfiguration(
  item: SpacerConfiguration
): void {
  expect(item).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      listing_id: expect.any(Number),
      name: expect.any(String),
      unit_type: expect.any(String),
      building_type: expect.any(String),
      reservation_type: expect.any(String),
      ev: expect.any(Boolean),
      stairs_access: expect.any(Boolean),
      tricky_access: expect.any(Boolean),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })
  );

  expect(
    item.stacker_type === null ||
      typeof item.stacker_type === 'string',
    `Expected stacker_type to be null or a string, got: ${JSON.stringify(item.stacker_type)}`
  ).toBeTruthy();

  expect(
    item.height_restriction === null ||
      typeof item.height_restriction === 'string',
    `Expected height_restriction to be null or a string, got: ${JSON.stringify(item.height_restriction)}`
  ).toBeTruthy();

  expect(
    item.level === null ||
      typeof item.level === 'number',
    `Expected level to be null or a number, got: ${JSON.stringify(item.level)}`
  ).toBeTruthy();

  expect(
    item.level_type === null ||
      typeof item.level_type === 'string',
    `Expected level_type to be null or a string, got: ${JSON.stringify(item.level_type)}`
  ).toBeTruthy();
}