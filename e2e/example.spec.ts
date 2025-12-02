import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Kasa/)
})

test('navigation works', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Families')
  await expect(page).toHaveURL(/.*families/)
})

