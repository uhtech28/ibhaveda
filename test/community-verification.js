const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set to false to see browser
  const page = await browser.newPage();

  const consoleErrors = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3000/community', { waitUntil: 'networkidle0' });

    // Wait for user cards to load
    await page.waitForSelector('[class*="hover:shadow-lg"]', { timeout: 10000 });

    const userCards = await page.$$('[class*="hover:shadow-lg"]');

    console.log(`✓ Community page loaded. Found ${userCards.length} user cards.`);

    if (userCards.length < 2) {
      console.log('❌ Expected at least 2 users, but found', userCards.length);
    } else {
      console.log('✅ Verified: At least 2 users displayed');

      // Log information for first 2 users
      for (let i = 0; i < Math.min(2, userCards.length); i++) {
        const displayName = await userCards[i].$eval('h3.font-semibold', el => el.textContent.trim()).catch(() => 'N/A');
        const username = await userCards[i].$eval('p.text-sm.text-muted-foreground', el => el.textContent.trim()).catch(() => 'N/A');
        const bio = await userCards[i].$eval('p.line-clamp-2', el => el.textContent.trim()).catch(() => 'No bio');
        const followers = await userCards[i].$eval('span', el => {
          const spans = el.parentElement.querySelectorAll('span');
          return spans.length > 0 ? spans[0].textContent.trim() : 'N/A';
        }).catch(() => 'N/A');

        console.log(`User ${i + 1}: ${displayName} (@${username}), Bio: ${bio}, Followers: ${followers}`);
      }
    }

    console.log('\n--- Manual Testing Steps ---');
    console.log('1. Follow/Unfollow: Click the Follow button on a user card. Verify it changes to Following and updates follower count.');
    console.log('2. Profile Access: Click "View Profile" button on a user card. Verify it navigates to the profile page.');
    console.log('3. Check Console: Verify no errors are logged in the browser console during page load and interactions.');
    console.log('4. Responsive Design: Resize browser window to check mobile and tablet layouts.');
    console.log('5. Navigation: Use browser back/forward buttons and verify no issues.');

    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected during loading.');
    } else {
      console.log(`❌ ${consoleErrors.length} console errors detected:`, consoleErrors);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})()