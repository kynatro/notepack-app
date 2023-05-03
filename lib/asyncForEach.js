/**
 * Async forEach()
 * 
 * https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
 * 
 * Iterate over an array of items using the async/await pattern to
 * ensure items are stepped through in serial
 * 
 * @param {Array} array Array of items to iterate through
 * @param {Function} callback Function to execute on each item
 */
export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
