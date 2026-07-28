class QueryBuilder {
  constructor(queryPromise) {
    this.queryPromise = queryPromise;
  }

  select(fields) {
    this.queryPromise = this.queryPromise.then(res => {
      if (!res) return res;

      const processItem = (item) => {
        if (typeof fields !== 'string') return item;

        const fieldList = fields.split(/\s+/).filter(Boolean);
        if (fieldList.length === 0) return item;

        // If ALL fields start with '+' (e.g., '+password'), it's a Mongoose-style
        // inclusion hint meaning "include this normally-hidden field".
        // Since our SQL queries already return all fields, this is a no-op —
        // just return the original object unchanged (preserving functions like matchPassword).
        if (fieldList.every(f => f.startsWith('+'))) {
          return item;
        }

        // If it's a negative selection (e.g., '-password'), remove those fields
        if (fieldList.every(f => f.startsWith('-'))) {
          const stripped = { ...item };
          fieldList.forEach(f => {
            const prop = f.substring(1);
            delete stripped[prop];
          });
          return stripped;
        }

        // If it's a positive selection (e.g., 'name email department designation'),
        // build a whitelist object with only the requested fields + id/_id.
        // Also preserve any functions (like matchPassword, save) from the original object.
        const selected = { id: item.id, _id: item._id };
        fieldList.forEach(f => {
          if (item[f] !== undefined) {
            selected[f] = item[f];
          }
        });
        // Copy over any functions from the original object
        for (const key of Object.keys(item)) {
          if (typeof item[key] === 'function' && !(key in selected)) {
            selected[key] = item[key];
          }
        }
        return selected;
      };

      if (Array.isArray(res)) {
        return res.map(processItem);
      }
      return processItem(res);
    });
    return this;
  }

  populate(path, select) {
    // Relationships are pre-joined in SQL, so this is a no-op
    return this;
  }

  sort(sortOption) {
    // Sorting is handled directly in SQL, so this is a no-op
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.queryPromise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.queryPromise.catch(onRejected);
  }
}

module.exports = QueryBuilder;
