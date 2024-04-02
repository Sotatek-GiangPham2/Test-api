import * as rediss from 'redis';
const JWTR = require('jwt-redis').default;
console.log(process.env.REDIS_PORT);

const redis = rediss.createClient({
	url: `rediss://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redis.connect();
const jwtr = new JWTR(redis);

export default jwtr;
