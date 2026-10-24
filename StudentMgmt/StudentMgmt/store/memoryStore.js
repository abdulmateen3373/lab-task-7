// store/memoryStore.js - STEP 1: the in-memory data layer (Part 1)
// Data lives in a normal array, so it is LOST when the server stops.

class MemoryStore {
  constructor(seed = []) {
    this.items = seed.map((item) => ({ ...item }));
    this.nextId = this.items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  all(predicate = () => true) {
    return this.items.filter(predicate).map((item) => ({ ...item }));    // copies, so callers cannot change the store by accident
  }

  find(id) {
    const item = this.items.find((i) => i.id === Number(id));
    return item ? { ...item } : null;
  }

  findOne(predicate) {
    const item = this.items.find(predicate);
    return item ? { ...item } : null;
  }

  create(data) {
    const item = { id: this.nextId++, ...data };
    this.items.push(item);
    this.afterChange();
    return { ...item };
  }

  update(id, changes) {
    const index = this.items.findIndex((i) => i.id === Number(id));
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...changes, id: this.items[index].id };   // id can never change
    this.afterChange();
    return { ...this.items[index] };
  }

  remove(id) {
    const index = this.items.findIndex((i) => i.id === Number(id));
    if (index === -1) return null;
    const [removed] = this.items.splice(index, 1);
    this.afterChange();
    return removed;
  }

  removeWhere(predicate) {
    const before = this.items.length;
    this.items = this.items.filter((i) => !predicate(i));
    const removed = before - this.items.length;
    if (removed > 0) this.afterChange();
    return removed;
  }

  // Hook called after every change. Does nothing in memory.
  // FileStore overrides it to save to disk - that is the ONLY difference.
  afterChange() {}
}

module.exports = MemoryStore;
