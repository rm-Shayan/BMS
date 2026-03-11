import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 120, // every 2 min expired keys check
});

export default cache;