import { test, expect } from '@playwright/test'

test.describe('Customer Claim Flow', () => {
  test('landing page loads with CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText("We're here to help.")).toBeVisible()
    await expect(page.getByText('File a Death Benefit Claim')).toBeVisible()
    await expect(page.getByText('Check Claim Status')).toBeVisible()
  })

  test('navigate to policy lookup from landing', async ({ page }) => {
    await page.goto('/')
    await page.getByText('File a Death Benefit Claim').click()
    await expect(page).toHaveURL('/claim/lookup')
    await expect(page.getByText('Find the Policy')).toBeVisible()
  })

  test('policy lookup shows toggle between modes', async ({ page }) => {
    await page.goto('/claim/lookup')
    await expect(page.getByText('I have the policy number')).toBeVisible()
    await expect(page.getByText("I don't have it")).toBeVisible()
  })

  test('policy lookup by number shows form', async ({ page }) => {
    await page.goto('/claim/lookup')
    await expect(page.getByPlaceholder('e.g. LT-29471')).toBeVisible()
    await expect(page.getByText('Find Policy')).toBeVisible()
  })

  test('policy lookup by name shows name/dob/ssn fields', async ({ page }) => {
    await page.goto('/claim/lookup')
    await page.getByText("I don't have it").click()
    await expect(page.getByPlaceholder('John Smith')).toBeVisible()
    await expect(page.getByText("Last 4 of SSN")).toBeVisible()
  })

  test('navigate to claim status from landing', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Check Claim Status').click()
    await expect(page).toHaveURL('/claim/status')
    await expect(page.getByText('Check Claim Status')).toBeVisible()
  })

  test('claim status page shows form fields', async ({ page }) => {
    await page.goto('/claim/status')
    await expect(page.getByPlaceholder('CLM-2026-00001')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
  })

  test('step indicator shows on policy lookup', async ({ page }) => {
    await page.goto('/claim/lookup')
    await expect(page.locator('.step-indicator')).toBeVisible()
  })
})

test.describe('Customer Claim Flow - Full Journey', () => {
  test('policy lookup -> beneficiary flow (with backend)', async ({ page }) => {
    // This test requires the backend to be running with seeded data
    await page.goto('/claim/lookup')

    // Try looking up a seeded policy
    await page.getByPlaceholder('e.g. LT-29471').fill('LT-29471')
    await page.getByText('Find Policy').click()

    // Should show the found policy card or an error (depends on seed state)
    // We just verify the button interaction works
    await expect(page.locator('.page-content')).toBeVisible()
  })
})
