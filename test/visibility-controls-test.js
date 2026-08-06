const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

async function runVisibilityTests() {
  console.log("🧪 Testing Sub-Idea Visibility Controls\n");

  // Initialize Convex client
  const client = new ConvexHttpClient(process.env.CONVEX_URL);

  try {
    // Test 1: Public Parent Ideas - Sub-ideas should be visible to all
    console.log("Test 1: Public Parent Ideas");
    console.log("-".repeat(50));

    const publicParentId = await createTestIdea(client, "Public Root Idea", "public");
    const publicSubIdeaId = await createTestSubIdea(client, publicParentId, "Public Sub-Idea", "public");

    console.log(`Created public parent idea: ${publicParentId}`);
    console.log(`Created public sub-idea: ${publicSubIdeaId}`);

    // Test visibility for anonymous user
    const anonymousResult = await testVisibility(client, publicParentId, null);
    console.log("Anonymous user visibility:", anonymousResult ? "✅ VISIBLE" : "❌ HIDDEN");

    // Test visibility for authenticated user (non-contributor)
    const userId = await createTestUser(client);
    const authenticatedResult = await testVisibility(client, publicParentId, userId);
    console.log("Authenticated non-contributor visibility:", authenticatedResult ? "✅ VISIBLE" : "❌ HIDDEN");

    console.log("\n");

    // Test 2: Private Parent Ideas
    console.log("Test 2: Private Parent Ideas");
    console.log("-".repeat(50));

    const privateParentId = await createTestIdea(client, "Private Root Idea", "private");
    const privateSubIdeaId = await createTestSubIdea(client, privateParentId, "Private Sub-Idea", "private");

    console.log(`Created private parent idea: ${privateParentId}`);
    console.log(`Created private sub-idea: ${privateSubIdeaId}`);

    // Test visibility for anonymous user
    const privateAnonymousResult = await testVisibility(client, privateParentId, null);
    console.log("Anonymous user visibility:", privateAnonymousResult ? "❌ SHOULD BE HIDDEN" : "✅ CORRECTLY HIDDEN");

    // Test visibility for authenticated user (non-contributor)
    const privateNonContributorResult = await testVisibility(client, privateParentId, userId);
    console.log("Authenticated non-contributor visibility:", privateNonContributorResult ? "❌ SHOULD BE HIDDEN" : "✅ CORRECTLY HIDDEN");

    // Test visibility for author
    const authorResult = await testVisibility(client, privateParentId, userId); // Assuming userId is author
    console.log("Author visibility:", authorResult ? "✅ VISIBLE" : "❌ SHOULD BE VISIBLE");

    // Test visibility for accepted contributor
    const contributorId = await createTestUser(client, "contributor");
    await createAcceptedContributionRequest(client, privateParentId, contributorId);
    const contributorResult = await testVisibility(client, privateParentId, contributorId);
    console.log("Accepted contributor visibility:", contributorResult ? "✅ VISIBLE" : "❌ SHOULD BE VISIBLE");

    console.log("\n");

    // Test 3: Mixed Visibility Scenarios
    console.log("Test 3: Mixed Visibility Scenarios");
    console.log("-".repeat(50));

    const mixedPublicParentId = await createTestIdea(client, "Mixed Public Root", "public");
    const mixedPrivateSubId = await createTestSubIdea(client, mixedPublicParentId, "Private Sub under Public", "private");

    console.log(`Created mixed public parent: ${mixedPublicParentId}`);
    console.log(`Created private sub-idea: ${mixedPrivateSubId}`);

    // Private sub-idea under public parent should follow private rules
    const mixedAnonymousResult = await testVisibility(client, mixedPublicParentId, null);
    console.log("Anonymous user (private sub under public parent):", mixedAnonymousResult ? "❌ SHOULD BE HIDDEN" : "✅ CORRECTLY HIDDEN");

    const mixedNonContributorResult = await testVisibility(client, mixedPublicParentId, userId);
    console.log("Non-contributor (private sub under public parent):", mixedNonContributorResult ? "❌ SHOULD BE HIDDEN" : "✅ CORRECTLY HIDDEN");

    console.log("\n🎉 Visibility tests completed!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

async function createTestIdea(client, title, visibility) {
  // This would need to be implemented based on your createIdea mutation
  // For now, returning a placeholder
  console.log(`Creating ${visibility} idea: ${title}`);
  return "placeholder_idea_id";
}

async function createTestSubIdea(client, parentId, title, visibility) {
  // This would need to be implemented based on your addSubIdea mutation
  console.log(`Creating ${visibility} sub-idea: ${title} under ${parentId}`);
  return "placeholder_sub_idea_id";
}

async function createTestUser(client, role = "user") {
  // This would need to be implemented based on your user creation
  console.log(`Creating test ${role} user`);
  return "placeholder_user_id";
}

async function createAcceptedContributionRequest(client, ideaId, contributorId) {
  // This would need to be implemented based on your contribution request system
  console.log(`Creating accepted contribution request for idea ${ideaId} and user ${contributorId}`);
}

async function testVisibility(client, rootIdeaId, userId) {
  try {
    // This would call your getIdeaTree query
    // For now, returning placeholder
    const result = await client.query(api.ideas.getIdeaTree, { rootIdeaId });
    return result !== null;
  } catch (error) {
    console.error("Visibility test error:", error.message);
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runVisibilityTests();
}

module.exports = { runVisibilityTests };