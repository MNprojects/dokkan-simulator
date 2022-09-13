import { DokkanSimulator } from '../src/index';
import { deepEqual, equal } from "assert";


describe('Single Character Simulation', function () {
    it('should have the same name', function () {
        let result = DokkanSimulator.singleCharacterSimulation({ name: 'Test' }, {})
        equal(result, 'Test');
    });
});

