const AbstractModel = require('./abstract');

const fromSymb = Symbol('from');
const toSymb = Symbol('to');

module.exports = class AbstractEdge extends AbstractModel {
  static get collection() {
    return this.db.edgeCollection(this.collectionName);
  }

  get single() {
    this.isSingle = true;
    return this;
  }

  from(id) {
    this[fromSymb] = id;
    return this;
  }

  to(id) {
    this[toSymb] = id;
    return this;
  }

  async create() {
    const result = await this.collection.save(this._validatedData);
    return this
      .with(result);
  }

  get _validatedData() {
    const data = super._validatedData;
    if (!this[toSymb] || !this[fromSymb]) {
      throw new Error('From / to should be set');
    }
    if (this.isSingle) {
      // @todo: should log something if key are not available
      this._data._key = `${this[fromSymb].key}-${this[toSymb].key}`;
    }
    data._from = this[fromSymb].id;
    data._to = this[toSymb].id;
    return data;
  }

  static async buildDeepTree(origin) {
    const traversal = await this.collection.traversal(origin.id, {
      direction: 'outbound',
      startVertex: origin.id,
      filter: `if (!vertex._id.startsWith("${origin.constructor.collectionName}/")) {
        return "exclude";
        }
        return;`,
      edgeCollection: this.collectionName,
      maxDepth: 10,
    });
    return traversal.visited.vertices.map(v => origin.constructor.new.replace(v));
  }

  async remove() {
    await this.collection.remove(this._discriminators);
    return this;
  }
};
