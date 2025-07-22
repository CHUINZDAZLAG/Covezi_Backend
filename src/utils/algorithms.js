// Calculate skip value for database pagination queries
export const pagingSkipValue = (page, itemsPerPage) => {
  // Return 0 for invalid or missing parameters to ensure safe pagination
  if (!page || !itemsPerPage) return 0
  if (page <= 0 || itemsPerPage <= 0) return 0

  return (page - 1) * itemsPerPage
}