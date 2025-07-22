/**
 * Sort an array based on a predefined order array
 * @param {Array} originalArray - The array to be sorted
 * @param {Array} orderArray - Array defining the desired order sequence
 * @param {string} key - Object property to use for ordering comparison
 * @returns {Array} New array sorted according to the order specified in orderArray
 *
 * Example: Sort columns by their predefined order in columnOrderIds
 * mapOrder([col1, col2, col3], ['col3_id', 'col1_id', 'col2_id'], '_id')
 * Returns: [col3, col1, col2]
 */

export const mapOrder = (originalArray, orderArray, key) => {
  if (!originalArray || !orderArray || !key) return []

  const clonedArray = [...originalArray]
  const orderedArray = clonedArray.sort((a, b) => {
    return orderArray.indexOf(a[key]) - orderArray.indexOf(b[key])
  })

  return orderedArray
}
