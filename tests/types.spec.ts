import { Character, CharacterBuilder, SimConfiguration, KiSpheres, Type, GameState, SimConfigurationBuilder } from '../src/types';
import { strictEqual, throws } from "assert";

let baseCharacter: Character;
let config: SimConfiguration;

describe('Character Builder', function () {
    it('should not allow negative numbers for base attack', function () {
        // Assert.Throws<Exception>(() => user.MakeUserActive());
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, -10000, 12, [], 1).build(), "NOT WORKINGBase Attack must be a positive number" })
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