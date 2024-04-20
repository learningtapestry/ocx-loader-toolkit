export default function forEachAsync<TItem, TResult>(
  array: TItem[],
  callback: (item: TItem, index: number) => Promise<TResult>
) {
  const promises: Promise<TResult>[] = [];
  array.forEach((item, index) => promises.push(callback(item, index)));
  return promises;
}
