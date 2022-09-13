import { DokkanSimulator } from '../src/index';
import { deepEqual, equal } from "assert";


describe('Single Character Simulation', function () {
    it('should have the same number of turns as given in the config', function () {
        let testTurn = 4
        let result = DokkanSimulator.singleCharacterSimulation({ name: 'Test' }, { turns: testTurn})
        console.log(result);
        
        equal(Object.keys(result.results).length, testTurn);
    });
});

