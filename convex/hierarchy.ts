// Idea hierarchy queries used by the breadcrumb + tree-nav UI on
// /idea/[id]. The same data could be derived client-side, but doing it
// server-side gives us a clean single round-trip per page load and
// avoids the "loading parent while child is rendered" flicker.

import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

type LineageNode = {
  _id: Id<"ideas">;
  title: string;
  isCurrent: boolean;
};

type TreeNode = {
  _id: Id<"ideas">;
  title: string;
  visibility: string;
  authorId: Id<"users">;
  isCurrent: boolean;
  children: TreeNode[];
};

// Walk up parent links from the given idea to the root, returning the chain
// in root-to-current order. Used by the breadcrumb. Skips deleted nodes
// silently (so a half-deleted chain still renders something usable).
export const getIdeaLineage = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args): Promise<LineageNode[]> => {
    const path: Doc<"ideas">[] = [];
    let current: Doc<"ideas"> | null = await ctx.db.get(args.ideaId);
    let safety = 0;
    while (current && safety < 100) {
      if (!current.isDeleted) path.push(current);
      if (!current.parentId) break;
      current = await ctx.db.get(current.parentId);
      safety += 1;
    }
    // path was collected child → ... → root. Reverse so callers get
    // root → ... → child (the natural breadcrumb reading order).
    path.reverse();

    return path.map((idea) => ({
      _id: idea._id,
      title: idea.title,
      isCurrent: idea._id === args.ideaId,
    }));
  },
});

// Walk up to the root, then collect the entire descendant subtree. Returns
// a nested tree with `isCurrent: true` on the node the user is viewing so
// the UI can render a "You are here" marker.
export const getIdeaFullTree = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args): Promise<TreeNode | null> => {
    // 1. Walk up to root
    let root: Doc<"ideas"> | null = await ctx.db.get(args.ideaId);
    if (!root) return null;
    let safety = 0;
    while (root && root.parentId && safety < 100) {
      const parent: Doc<"ideas"> | null = await ctx.db.get(root.parentId);
      if (!parent) break;
      root = parent;
      safety += 1;
    }
    if (!root || root.isDeleted) return null;

    // 2. Build subtree from root downward, marking the current node
    const buildSubtree = async (idea: Doc<"ideas">): Promise<TreeNode> => {
      const childRows = await ctx.db
        .query("ideas")
        .withIndex("by_parent", (q) => q.eq("parentId", idea._id))
        .collect();

      const children: TreeNode[] = [];
      for (const child of childRows) {
        if (child.isDeleted) continue;
        children.push(await buildSubtree(child));
      }

      // Stable sort: oldest first, so the tree doesn't jiggle as new
      // sub-ideas are added.
      children.sort((a, b) => a.title.localeCompare(b.title));

      return {
        _id: idea._id,
        title: idea.title,
        visibility: idea.visibility,
        authorId: idea.authorId,
        isCurrent: idea._id === args.ideaId,
        children,
      };
    };

    return await buildSubtree(root);
  },
});
