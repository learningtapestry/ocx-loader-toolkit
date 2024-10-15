import _ from 'lodash';

interface Entry<K extends Array<Object>, V> {
  key: K;
  value: V;
}

// A map that can have arrays as keys. When the first N elements are of type string, we use hashing to improve performance
class DeepArrayMap<K extends Array<Object>, V> {
  private mapBuckets: Map<string, Entry<K, V>[]>;

  constructor() {
    this.mapBuckets = new Map();
  }

  private getKeyHash(key: K): string {
    // create a hash of the key until you find the first element in the array which is not a string
    const hashArray: Array<string> = ['_____'];
    for (const element of key) {
      if (typeof element !== 'string') {
        break;
      }
      hashArray.push(element);
    }
    return hashArray.join('&&&');
  }

  private getMapBucket(key: K): Entry<K, V>[] {
    let bucket = this.mapBuckets.get(this.getKeyHash(key));

    if (!bucket) {
      bucket = [];
      this.mapBuckets.set(this.getKeyHash(key), bucket);
    }

    return bucket;
  }

  set(key: K, value: V): void {
    const map = this.getMapBucket(key);

    const index = map.findIndex(entry => _.isEqual(entry.key, key));
    if (index === -1) {
      map.push({ key, value });
    } else {
      map[index].value = value;
    }
  }

  get(key: K): V | undefined {
    const map = this.getMapBucket(key);

    const entry = map.find(entry => _.isEqual(entry.key, key));
    return entry ? entry.value : undefined;
  }

  has(key: K): boolean {
    const map = this.getMapBucket(key);

    return map.some(entry => _.isEqual(entry.key, key));
  }

  delete(key: K): void {
    const map = this.getMapBucket(key);

    const index = map.findIndex(entry => _.isEqual(entry.key, key));
    if (index !== -1) {
      map.splice(index, 1);
    }
  }

  clear(): void {
    this.mapBuckets.clear();
  }

  get size(): number {
    return Array.from(this.mapBuckets.values()).reduce((size, map) => size + map.length, 0);
  }
}

export default DeepArrayMap;
