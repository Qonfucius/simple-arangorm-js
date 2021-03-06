const { aql } = require('arangojs');
const AbstractModel = require('./abstract');

module.exports = class AbstractDocument extends AbstractModel {
  static get collection() {
    return this.db.collection(this.collectionName);
  }

  async create({ returnNew = true, silent = false } = {}) {
    const result = await this.collection.save(this._validatedData, { returnNew, silent });
    if (result.new) {
      this.replace(result.new);
    }
    return this;
  }

  async update({ returnNew = true, silent = false } = {}) {
    const result = await this.collection.update(this._discriminators, this._validatedContent, { returnNew, silent });
    if (result.new) {
      this.replace(result.new);
    }
    return this;
  }

  async save({ returnNew = true, silent = false } = {}) {
    if (this.key) {
      return this.update({ returnNew, silent });
    }
    return this.create({ returnNew, silent });
  }

  static async findById(id, revision) {
    const criteria = { _key: id };
    if (revision) {
      criteria._rev = revision;
    }
    return this.findOne(criteria);
  }

  static async findOne(example) {
    const data = await this.collection.firstExample(example);
    return this.new.replace(data);
  }

  /**
   * Return cursor of entries
   * @returns {Promise.<void>}
   */
  static async find(example = {}, { offset = 0, limit = 100 } = {}) {
    const query = await this.collection.byExample(example, { skip: offset, limit });
    const array = await query.all();
    return array.map(o => this.new.replace(o));
  }

  static async count() {
    const query = await this.query(aql`
      RETURN LENGTH(
        FOR d IN ${this.collection}
          RETURN 1
      )
    `);
    const [count] = await query.all();
    return count;
  }
};
