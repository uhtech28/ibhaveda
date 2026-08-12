type IdeaLike = {
  title?: string;
  category?: string;
  isDeleted?: boolean;
  parentId?: unknown;
};

export function isTaskCompletionPost(idea: IdeaLike): boolean {
  const title = idea.title?.trim() ?? "";
  const category = idea.category?.trim().toLowerCase() ?? "";

  return (
    category === "milestone" ||
    /^completed:\s*T[123]\b/i.test(title) ||
    /^completed\s+T[123]\b/i.test(title)
  );
}

export function isCreatedProfileIdea(idea: IdeaLike): boolean {
  return !idea.isDeleted && !idea.parentId && !isTaskCompletionPost(idea);
}
