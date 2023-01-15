import { Character, CharacterBuilder, SimConfiguration, KiSpheres, Type, GameState, SimConfigurationBuilder } from '../src/types';
import { strictEqual, throws, deepStrictEqual } from "assert";

let baseCharacter: Character;
let config: SimConfiguration;

describe('Character Builder', function () {
    it('should create a character with the given stats', function () {
        let standardChar = new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 24, [], 1).build()
        strictEqual(standardChar.name, "Test")
        strictEqual(standardChar.title, "Title")
        strictEqual(standardChar.type, Type.TEQ)
        strictEqual(standardChar.baseAttack, 10000)
        strictEqual(standardChar.maxKi, 24)
        deepStrictEqual(standardChar.superAttacks, [])
        strictEqual(standardChar.twelveKiMultiplier, 1)
    });
    it('should not allow negative numbers for base attack', function () {
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, -10000, 12, [], 1).build() })
    });
    it('should only allow 12 or 24 for MaxKi', function () {
        let URKiChar = new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [], 1).build()
        strictEqual(URKiChar.maxKi, 12)
        let LRKiChar = new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 24, [], 1).build()
        strictEqual(LRKiChar.maxKi, 24)
        for (let index = -2; index < 12; index++) {
            throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10000, index, [], 1).build() })
        }
        for (let index = 13; index < 24; index++) {
            throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10000, index, [], 1).build() })
        }
        for (let index = 25; index < 30; index++) {
            throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10000, index, [], 1).build() })
        }
    });
});

// describe('Character Builder', function () {
//     it('should not allow negative numbers for base attack', function () {
//         config = new SimConfigurationBuilder()
//             .appearances(3)
//             .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 1 })
//             .build()
//         strictEqual(Object.keys(result.turnData).length, expectedAppearances);
//     });
// });