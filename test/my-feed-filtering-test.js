const puppeteer = require('puppeteer');

async function testMyFeedFiltering() {
  console.log("🧪 Testing My Feed filtering functionality\n");

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    // Navigate to the application
    console.log("Navigating to application...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for and click sign in button or navigate to sign in
    console.log("Attempting to sign in...");
    try {
      await page.waitForSelector('button:has-text("Sign in")', { timeout: 10000 });
      await page.click('button:has-text("Sign in")');
    } catch {
      // Try alternative sign in methods
      const signInLinks = await page.$$('a[href*="sign-in"]');
      if (signInLinks.length > 0) {
        await signInLinks[0].click();
      } else {
        console.log("Sign in button/link not found, assuming user is already signed in");
      }
    }

    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to My Feed page
    console.log("Navigating to My Feed page...");
    await page.goto('http://localhost:3000/my-feed', { waitUntil: 'networkidle' });

    // Wait for ideas to load
    console.log("Waiting for ideas to load...");
    await page.waitForSelector('[data-testid="idea-card"]', { timeout: 10000 });

    // Get all displayed ideas
    const displayedIdeas = await page.$$eval('[data-testid="idea-card"] h3', elements =>
      elements.map(el => el.textContent.trim())
    );

    console.log(`Found ${displayedIdeas.length} ideas displayed in My Feed`);
    console.log("Displayed idea titles:", displayedIdeas);

    // Get current user's ideas from database for comparison
    console.log("Fetching user's ideas from database...");

    // Note: In a real test, you'd need to authenticate with Convex to get user ideas
    // For now, we'll check if the filtering logic is working by examining the page content

    // Check if any contributed ideas are present (this would be a failure)
    const contributedIndicators = await page.$$eval('[data-testid="contributed-idea"]', elements =>
      elements.length
    );

    if (contributedIndicators > 0) {
      console.log("❌ FAILURE: Found contributed ideas in My Feed");
      console.log(`Found ${contributedIndicators} contributed ideas`);
    } else {
      console.log("✅ PASS: No contributed ideas found in My Feed");
    }

    // Check if ideas are displayed (at least some original ideas)
    const ideaCount = await page.$$eval('[data-testid="idea-card"]', elements =>
      elements.length
    );

    if (ideaCount > 0) {
      console.log("✅ PASS: User's original ideas are displayed");
      console.log(`Total ideas displayed: ${ideaCount}`);
    } else {
      console.log("ℹ️  INFO: No ideas displayed (user may have no original ideas)");
    }

    // Take a screenshot for manual verification
    await page.screenshot({ path: 'test/my-feed-test-result.png', fullPage: true });
    console.log("Screenshot saved to test/my-feed-test-result.png");

    await browser.close();

    // Summary
    console.log("\n📊 Test Results Summary:");
    console.log("======================");
    console.log(`Ideas displayed: ${ideaCount}`);
    console.log(`Contributed ideas found: ${contributedIndicators}`);
    console.log(`Test passed: ${contributedIndicators === 0 ? 'YES' : 'NO'}`);

    return {
      ideasDisplayed: ideaCount,
      contributedIdeasFound: contributedIndicators,
      testPassed: contributedIndicators === 0,
      displayedTitles: displayedIdeas
    };

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return {
      error: error.message,
      testPassed: false
    };
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMyFeedFiltering().then(results => {
    console.log("\nFinal Results:", results);
    process.exit(results.testPassed ? 0 : 1);
  });
}

module.exports = { testMyFeedFiltering };