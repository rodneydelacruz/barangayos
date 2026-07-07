import { test, expect } from '@playwright/test'

test('dashboard loads with authenticated user', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('customize panel opens and closes', async ({ page }) => {
  await page.goto('/')
  const customizeBtn = page.getByRole('button', { name: /customize/i })
  await expect(customizeBtn).toBeVisible()
  await customizeBtn.click()
  await expect(page.getByRole('button', { name: 'Reset to Role Defaults' })).toBeVisible()
  await page.keyboard.press('Escape')
})
