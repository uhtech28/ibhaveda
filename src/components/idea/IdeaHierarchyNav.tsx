"use client";

// Idea hierarchy navigation for /idea/[id]:
//
//   1. <IdeaBreadcrumb /> — horizontal Feed > Root > Sub > Current strip
//      across the top. Quick way to jump up the tree.
//
//   2. <IdeaHierarchyFlowchart /> — full flowchart of the idea family
//      (root + every descendant) laid out top-down with connector lines,
//      like a project org chart. Current node is highlighted with a
//      "You are here" badge so the user always knows their position.
//
// Both query `convex/hierarchy.ts` and ALWAYS show the whole family
// regardless of where in the tree the user currently is — solving the
// problem where Contribution 1's view couldn't see Idea or Contribution
// 2 above/beside it.

import Link from "next/link";
import { useQuery } from "convex/react";
import { ChevronRight, Home, MapPin, GitBranch } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface IdeaBreadcrumbProps {
  ideaId: Id<"ideas">;
  className?: string;
}

export function IdeaBreadcrumb({ ideaId, className }: IdeaBreadcrumbProps) {
  const lineage = useQuery(api.hierarchy.getIdeaLineage, { ideaId });

  if (lineage === undefined) {
    return (
      <nav
        aria-label="Idea breadcrumb"
        className={cn(
          "flex items-center gap-1.5 text-xs text-[#9CA3AF] py-2",
          className
        )}
      >
        <div className="h-3 w-3 rounded-sm bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-20 rounded-sm bg-white/[0.06] animate-pulse" />
      </nav>
    );
  }

  if (lineage.length === 0) return null;

  return (
    <nav
      aria-label="Idea breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-[#9CA3AF] py-2",
        className
      )}
    >
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 hover:text-white transition-colors"
      >
        <Home className="h-3 w-3" />
        <span>Feed</span>
      </Link>

      {lineage.map((node) => (
        <span key={node._id} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-[#4B5563]" />
          {node.isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#6366F1]/15 px-2 py-0.5 font-medium text-[#C7D2FE]">
              <MapPin className="h-3 w-3" />
              <span className="max-w-[280px] truncate">{node.title}</span>
            </span>
          ) : (
            <Link
              href={`/idea/${node._id}`}
              className="max-w-[280px] truncate hover:text-white transition-colors"
            >
              {node.title}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------

type TreeNode = {
  _id: Id<"ideas">;
  title: string;
  visibility: string;
  authorId: Id<"users">;
  isCurrent: boolean;
  children: TreeNode[];
};

interface IdeaHierarchyFlowchartProps {
  ideaId: Id<"ideas">;
  className?: string;
}

export function IdeaHierarchyFlowchart({
  ideaId,
  className,
}: IdeaHierarchyFlowchartProps) {
  const tree = useQuery(api.hierarchy.getIdeaFullTree, { ideaId });

  if (tree === undefined) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-white/8 bg-[#0F1726]/85 backdrop-blur-xl p-5",
          className
        )}
      >
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/8">
          <GitBranch className="h-3.5 w-3.5 text-[#C7D2FE]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Idea hierarchy
          </span>
        </div>
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="h-6 w-32 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="h-6 w-32 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="h-6 w-32 rounded-md bg-white/[0.06] animate-pulse" />
        </div>
      </section>
    );
  }

  if (!tree) return null;

  // If this is a standalone idea with no parent and no children, skip the
  // flowchart — there's nothing to chart.
  const hasFamily = tree.children.length > 0;
  if (!hasFamily) return null;

  return (
    <section
      aria-label="Idea hierarchy"
      className={cn(
        "rounded-2xl border border-white/8 bg-[#0F1726]/85 backdrop-blur-xl p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#6366F1]/15 text-[#C7D2FE]">
            <GitBranch className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Idea hierarchy
          </span>
        </div>
        <span className="text-[10px] text-[#6B7280]">
          Click any node to jump there
        </span>
      </div>

      {/* Horizontally scrollable so wide trees don't break the layout */}
      <div className="overflow-x-auto pb-2">
        <div className="flex justify-center min-w-fit px-4">
          <FlowchartNode node={tree} isRoot />
        </div>
      </div>
    </section>
  );
}

// Recursive node renderer. Each node draws its own box + connectors to its
// children. Layout strategy:
//   - Each node is a flex-column, items-center
//   - Below the node box: a short vertical line down to the children row
//   - If >1 child, a thin horizontal bar spans across the children to
//     show they're siblings
//   - Each child renders its own short vertical line UP from its top edge
//     back to the horizontal bar (or directly to the parent's vertical
//     line if it's the only child)
function FlowchartNode({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) {
  const hasChildren = node.children.length > 0;
  const childrenCount = node.children.length;

  return (
    <div className="flex flex-col items-center">
      <Link
        href={`/idea/${node._id}`}
        className={cn(
          "group relative inline-flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-2.5 text-sm transition-all min-w-[140px] max-w-[220px]",
          node.isCurrent
            ? "border-[#6366F1] bg-[#6366F1]/15 shadow-[0_0_28px_rgba(99,102,241,0.35)]"
            : "border-white/10 bg-[#0A0D12] hover:border-[#6366F1]/45 hover:bg-white/[0.04]"
        )}
      >
        <span
          className={cn(
            "font-semibold truncate max-w-full text-center",
            node.isCurrent ? "text-white" : "text-[#D1D5DB] group-hover:text-white"
          )}
        >
          {node.title}
        </span>
        {node.isCurrent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6366F1] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
            <MapPin className="h-2.5 w-2.5" />
            You are here
          </span>
        )}
        {isRoot && !node.isCurrent && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-[#6B7280]">
            Idea
          </span>
        )}
      </Link>

      {hasChildren && (
        <>
          {/* Vertical line down from parent */}
          <div className="h-6 w-0.5 bg-white/15" />

          {/* Children row — NO flex gap between siblings. Each child
              wrapper takes an equal share of the row (flex-1 basis-0)
              and uses its own internal horizontal padding for visual
              spacing instead. This way the per-child horizontal half-
              bars below meet at the wrapper boundaries with no gaps. */}
          <div className="flex items-start w-full">
            {node.children.map((child, i) => {
              const isFirst = i === 0;
              const isLast = i === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div
                  key={child._id}
                  className="relative flex flex-col items-center flex-1 basis-0 min-w-[160px] px-3 lg:px-5 pt-6"
                >
                  {/* Left half of horizontal connector — covers the gap
                      between this child and the previous sibling. */}
                  {!isOnly && !isFirst && (
                    <div className="absolute top-0 left-0 right-1/2 h-0.5 bg-white/15" />
                  )}
                  {/* Right half of horizontal connector — covers the gap
                      between this child and the next sibling. */}
                  {!isOnly && !isLast && (
                    <div className="absolute top-0 left-1/2 right-0 h-0.5 bg-white/15" />
                  )}
                  {/* Vertical line from the horizontal bar (or from the
                      parent's vertical, for an only-child) down to the
                      top of this child's box. */}
                  <div className="absolute top-0 left-1/2 -translate-x-px w-0.5 h-6 bg-white/15" />

                  <FlowchartNode node={child} isRoot={false} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
