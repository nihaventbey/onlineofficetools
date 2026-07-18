export const toolCategories = ["text", "developer", "security"] as const;
export type ToolCategory = (typeof toolCategories)[number];
