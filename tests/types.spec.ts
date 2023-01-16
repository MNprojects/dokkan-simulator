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
    it('should not allow negative (or zero) numbers for base attack', function () {
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, -10000, 12, [], 1).build() })
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 0, 12, [], 1).build() })
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
    it('should only allow numbers between 1 and 24 (inc) for the Ki Threshold of a Super Attack', function () {
        throws(() => {
            new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [{
                kiThreshold: 0,
                multiplier: 1,
            },
            {
                kiThreshold: 1,
                multiplier: 1,
            }], 1).build()
        })
        throws(() => {
            new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [{
                kiThreshold: 1,
                multiplier: 1,
            },
            {
                kiThreshold: -10,
                multiplier: 1,
            }], 1).build()
        })
        throws(() => {
            new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [{
                kiThreshold: 25,
                multiplier: 1,
            }], 1).build()
        })
        for (let index = 1; index < 25; index++) {
            let kiChar = new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [{
                kiThreshold: index,
                multiplier: 1,
            }], 1).build()
            strictEqual(kiChar.superAttacks[0].kiThreshold, index)
        }
    });
    it('should not allow negative (or zero) numbers for twelveKiMultiplier', function () {
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [], -1).build() })
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10, 12, [], 0).build() })
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