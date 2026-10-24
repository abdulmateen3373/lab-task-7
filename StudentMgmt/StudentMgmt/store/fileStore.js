// store/fileStore.js - STEP 6 (Part 2): the PERSISTENT data layer
// Same methods as MemoryStore, but every change is saved to a JSON file,
// and the file is loaded again when the server starts. Data survives restarts.

const fs = require('fs');
const path = require('path');
const MemoryStore = require('./memoryStore');

class FileStore extends MemoryStore {
  constructor(filePath, seed = []) {
    super(seed);
    this.filePath = filePath;

    if (fs.existsSync(filePath)) {
      this.load();
    } else {
      this.save();                       // first run: create the file with the seed data
    }
  }

  load() {
    try {
      const saved = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.items = Array.isArray(saved.items) ? saved.items : [];
      this.nextId = Number.isInteger(saved.nextId) ? saved.nextId : 1;
    } catch (error) {
      throw new Error(`Cannot read data file ${this.filePath}: ${error.message}`);
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tempFile = `${this.filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify({ nextId: this.nextId, items: this.items }, null, 2));
    fs.renameSync(tempFile, this.filePath);     // write-then-rename: a crash cannot leave a half-written file
  }

  afterChange() {
    this.save();
  }
}

module.exports = FileStore;
