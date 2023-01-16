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
    it('should only allow positive numbers for the Multiplier of a Super Attack', function () {
        throws(() => {
            new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [{
                kiThreshold: 10,
                multiplier: 0,
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
                kiThreshold: 1,
                multiplier: -1,
            }], 1).build()
        })
    });
    it('should not allow negative (or zero) numbers for twelveKiMultiplier', function () {
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10000, 12, [], -1).build() })
        throws(() => { new CharacterBuilder("Test", "Title", Type.TEQ, 10, 12, [], 0).build() })
    });
});

describe('Sim Configuration Builder', function () {
    it('should only allow positive numbers for appearances', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .appearances(-1)
                .build()
        })
        throws(() => {
            new SimConfigurationBuilder()
                .appearances(0)
                .build()
        })
        let config = new SimConfigurationBuilder()
            .appearances(1)
            .build()
        strictEqual(config.appearances, 1);
    });
    it('should only allow whole numbers between 0 and 6 (inc) for Starting Position', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .startingPosition(-1)
                .build()
        })
        for (let index = 0; index < 7; index++) {
            let config = new SimConfigurationBuilder()
                .startingPosition(index)
                .build()
            strictEqual(config.startingPosition, index);
        }
        throws(() => {
            new SimConfigurationBuilder()
                .startingPosition(7)
                .build()
        })
        throws(() => {
            new SimConfigurationBuilder()
                .startingPosition(6.7)
                .build()
        })
    });
    it('should only allow whole numbers between 0 and 6 (inc) for Desired Position', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .desiredPosition(-1)
                .build()
        })
        for (let index = 0; index < 7; index++) {
            let config = new SimConfigurationBuilder()
                .desiredPosition(index)
                .build()
            strictEqual(config.desiredPosition, index);
        }
        throws(() => {
            new SimConfigurationBuilder()
                .desiredPosition(7)
                .build()
        })
        throws(() => {
            new SimConfigurationBuilder()
                .desiredPosition(6.7)
                .build()
        })
    });

    it('should only allow positive whole numbers each Ki Sphere value', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: -10, STR: 0, PHY: 0, INT: 5, RBW: 1 })
                .build()
        })
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5.9, RBW: 1 })
                .build()
        })
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 25, RBW: 1 })
                .build()
        })
        for (let index = 0; index < 25; index++) {
            let config = new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: index, PHY: 0, INT: 0, RBW: 1 })
                .build()
            strictEqual(config.setKiSpheresEveryTurn?.STR, index);
        }
    });

    it('should only allow one typed Ki Sphere for set values', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 10, STR: 0, PHY: 0, INT: 5, RBW: 1 })
                .build()
        })
    });

    it('should allow up to 5 RBW spheres only', function () {
        for (let index = 0; index < 6; index++) {
            let config = new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: index })
                .build()
            strictEqual(config.setKiSpheresEveryTurn?.RBW, index);
        }
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 6 })
                .build()
        })
    });
    it('should not have any typed spheres with 5 RBW spheres', function () {
        throws(() => {
            new SimConfigurationBuilder()
                .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 5 })
                .build()
        })
    });


    // must have at least 1 typed sphere
    // must have a typed sphere with RBW unless 5


});