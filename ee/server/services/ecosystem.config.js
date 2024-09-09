const watch = ['.', '../broker.ts', '../../../server/sdk'];

let debugPort = 10000;

module.exports = {
	apps: [{
		name: 'authorization',
		watch: [...watch, '../../../server/services/authorization'],
	}, {
		name: 'presence',
	}, {
		name: 'account',
	}, {
		name: 'stream-hub',
	}, {
		name: 'ddp-streamer',
	}].map((app) =>Object.assign(app, {
		// script: `node --inspect-brk=0.0.0.0:${debugPort++} -r ts-node/register ${ app.name }/service.ts`,
		script: `ts-node --files ${ app.name }/service.ts`,
		watch: app.watch || ['.', '../broker.ts', '../../../server/sdk', '../../../server/modules'],
		instances: 1,
		env: {
			MOLECULER_LOG_LEVEL: 'info',
			TRANSPORTER: 'nats://localhost:4222',
			MONGO_URL: 'mongodb://localhost:3001/meteor',
		},
	})),
};

// module.exports = {
// 	apps: [{
// 		name: 'authorization',
// 		watch: [...watch, '../../../server/services/authorization'],
// 		script: `node --inspect-brk=0.0.0.0:9339 -r ts-node/register ../../../server/services/authorization/service.ts`,
// 		// script: `ts-node ../../../server/services/authorization/service.ts`,
// 		watch: ['.', '../broker.ts', '../../../server/sdk', '../../../server/modules'],
// 		instances: 1,
// 		env: {
// 			MOLECULER_LOG_LEVEL: 'info',
// 			TRANSPORTER: 'nats://localhost:4222',
// 			MONGO_URL: 'mongodb://localhost:3001/meteor',
// 		},
// 	}]
// };
