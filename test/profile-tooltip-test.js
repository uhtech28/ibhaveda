const puppeteer = require('puppeteer');

async function testProfileMetricsTooltips() {
  console.log('Starting comprehensive profile metrics tooltip testing...\n');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--window-size=1920,1080']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the test profile tooltip page
    const baseUrl = 'http://localhost:3000'; // Adjust if different
    const testUrl = `${baseUrl}/test-profile-tooltip`;

    console.log(`Navigating to ${testUrl}...`);
    await page.goto(testUrl, { waitUntil: 'networkidle2' });

    // Wait for the profile metrics to load
    try {
      await page.waitForSelector('.text-2xl.font-bold.text-primary', { timeout: 10000 });
      console.log('✅ Profile metrics loaded successfully');
    } catch (error) {
      console.log('❌ Profile metrics not found, checking page content...');
      const content = await page.content();
      console.log('Page content preview:', content.substring(0, 1000));

      // Check if we're actually on a different page
      if (content.includes('My Feed') || content.includes('Create Idea')) {
        console.log('❌ Wrong page loaded - seems to be on My Feed page instead of profile tooltip test page');
        throw new Error('Wrong page loaded');
      }

      throw error;
    }

    // Test tooltip functionality
    console.log('Testing tooltip functionality...');

    const metrics = [
      { name: 'Ideas Created', selector: '[aria-describedby="ideas-created-tooltip"]' },
      { name: 'Ideas Sparked', selector: '[aria-describedby="ideas-sparked-tooltip"]' },
      { name: 'Ideas Contributed To', selector: '[aria-describedby="ideas-contributed-tooltip"]' }
    ];

    for (const metric of metrics) {
      console.log(`\nTesting ${metric.name} tooltip:`);

      // Hover over the metric
      const element = await page.$(metric.selector);
      if (!element) {
        console.log(`❌ ${metric.name} element not found`);
        continue;
      }

      await element.hover();
      await page.waitForTimeout(500); // Wait for tooltip to appear

      // Check if tooltip is visible
      const tooltipVisible = await page.$('[role="tooltip"]');
      if (tooltipVisible) {
        console.log(`✅ ${metric.name} tooltip appears on hover`);

        // Check tooltip content
        const tooltipText = await page.$eval('[role="tooltip"]', el => el.textContent);
        console.log(`   Tooltip content: "${tooltipText}"`);

        // Check ARIA attributes
        const ariaDescribedBy = await page.$eval(metric.selector, el => el.getAttribute('aria-describedby'));
        console.log(`   ARIA describedby: ${ariaDescribedBy}`);

        // Test keyboard focus
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab'); // Tab to next focusable element
        await page.waitForTimeout(500);

        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('aria-describedby'));
        if (focusedElement === ariaDescribedBy) {
          console.log(`✅ ${metric.name} keyboard focus works`);
        } else {
          console.log(`❌ ${metric.name} keyboard focus not working`);
        }

        // Move mouse away to hide tooltip
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);

      } else {
        console.log(`❌ ${metric.name} tooltip does not appear on hover`);
      }
    }

    // Test responsiveness across different screen sizes
    console.log('\nTesting responsiveness...');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`\nTesting ${viewport.name} (${viewport.width}x${viewport.height})...`);
      await page.setViewport(viewport);

      // Check if tooltips still work at this viewport
      for (const metric of metrics) {
        const element = await page.$(metric.selector);
        if (element) {
          await element.hover();
          await page.waitForTimeout(500);
          const tooltipVisible = await page.$('[role="tooltip"]');
          if (tooltipVisible) {
            console.log(`✅ ${metric.name} tooltip works on ${viewport.name}`);
          } else {
            console.log(`❌ ${metric.name} tooltip broken on ${viewport.name}`);
          }
          await page.mouse.move(0, 0);
          await page.waitForTimeout(500);
        }
      }
    }

    // Test animations
    console.log('\nTesting animations...');
    await page.setViewport({ width: 1920, height: 1080 }); // Reset to desktop

    for (const metric of metrics) {
      const element = await page.$(metric.selector);
      if (element) {
        const startTime = Date.now();
        await element.hover();
        await page.waitForTimeout(1000); // Wait for animation

        const tooltip = await page.$('[role="tooltip"]');
        if (tooltip) {
          // Check if tooltip has animation classes (from Radix UI)
          const classes = await page.$eval('[role="tooltip"]', el => el.className);
          if (classes.includes('animate-in') || classes.includes('fade-in')) {
            console.log(`✅ ${metric.name} has smooth animations`);
          } else {
            console.log(`⚠️ ${metric.name} animation classes not detected`);
          }
        }
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);
      }
    }

    // Test screen reader compatibility
    console.log('\nTesting screen reader compatibility...');
    await page.setViewport({ width: 1920, height: 1080 });

    for (const metric of metrics) {
      const element = await page.$(metric.selector);
      if (element) {
        const ariaDescribedBy = await page.$eval(metric.selector, el => el.getAttribute('aria-describedby'));
        const tooltip = await page.$(`#${ariaDescribedBy}`);
        if (tooltip) {
          const role = await page.$eval(`#${ariaDescribedBy}`, el => el.getAttribute('role'));
          const ariaLive = await page.$eval(`#${ariaDescribedBy}`, el => el.getAttribute('aria-live'));
          if (role === 'tooltip' && ariaLive === 'polite') {
            console.log(`✅ ${metric.name} has proper screen reader attributes`);
          } else {
            console.log(`❌ ${metric.name} missing screen reader attributes (role: ${role}, aria-live: ${ariaLive})`);
          }
        }
      }
    }

    console.log('\n🎉 Testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testProfileMetricsTooltips().catch(console.error);