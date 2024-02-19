import chai from 'chai';
import { describe, it } from 'mocha';

import { createLookupFunction } from './lookups';

describe('createLookupFunction', () => {
	it('should work', () => {
		chai.expect(createLookupFunction('a.x')({ a: { x: 1 } })).to.be.deep.equals([1]);
		chai.expect(createLookupFunction('a.x')({ a: { x: [1] } })).to.be.deep.equals([[1]]);
		chai.expect(createLookupFunction('a.x')({ a: 5 })).to.be.deep.equals([undefined]);
		chai
			.expect(createLookupFunction('a.x')({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] }))
			.to.be.deep.equals([1, [2], undefined]);
	});
});
