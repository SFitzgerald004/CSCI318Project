export const TOOL_LABELS = {
  get_saved_recommendations: "Checked your saved items",
  get_savings_progress: "Reviewed savings progress",
  calculate_daily_spend: "Calculated daily spend",
};

export function humanizeToolName(name) {
  return TOOL_LABELS[name] || name;
}
