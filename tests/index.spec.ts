import { DokkanSimulator, Character, SimConfiguration, kiSpheres } from '../src/dokkanSimulator';
import { deepEqual, equal } from "assert";

let baseCharacter: any;
let config: SimConfiguration;

before(function () {
    baseCharacter =
    {
        name: 'Test',
        startOfTurn() { },
        baseAttack: 10000,
        categories: [],
        links: [],
        type: 'TEQ',
        collectKiSpheres(kiSpheres: kiSpheres) {
            let kiBoost = 0;
            Object.entries(kiSpheres).forEach(
                ([key, value]) => {
                    kiBoost += value;
                });
            kiBoost += kiSpheres.TEQ
        },
    }
    config = {
        appearances: 1,
        startingPosition: 0,
        desiredPosition: 1,
        leaderSkill1(char: any) { return char },
        leaderSkill2(char: any) { return char },
        percentageStartOfTurnAttack: 0,
        flatStartOfTurnAttack: 0,
        activeLinks: ["Super Saiyan"],
        percentageObtainKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        flatObtainKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
    }
})

describe('Single Character Simulation', function () {
    it('should have the same number of turns as given in the config', function () {
        let expectedAppearances = 4
        let appearancesConfig = Object.assign({}, config)
        appearancesConfig.appearances = expectedAppearances;

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, appearancesConfig)

        equal(Object.keys(result.turnData).length, expectedAppearances);
    });

    it('should have an unmodified attack in the results', function () {
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, baseCharacter.baseAttack);
    });

    it('should modify attack by the percentage leaderskills', function () {
        let leaderskillConfig = Object.assign([], config);
        leaderskillConfig.leaderSkill1 = function (char: any) {
            char.turnStats.percentageLeaderAttack += 1.7;
            return char
        }
        leaderskillConfig.leaderSkill2 = function (char: any) {
            char.turnStats.percentageLeaderAttack += 1.7;
            return char
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, leaderskillConfig)
        // console.log(result);
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 44000);
    });
    it('should modify attack by the flat and percentage leaderskills', function () {
        let leaderskillConfig = Object.assign([], config);
        leaderskillConfig.leaderSkill1 = function (char: any) {
            char.turnStats.flatLeaderAttack += 30000;
            return char
        }
        leaderskillConfig.leaderSkill2 = function (char: any) {
            char.turnStats.percentageLeaderAttack += 1.7;
            return char
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, leaderskillConfig)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 57000);
    });
    it('should modify attack by percentage start of turn passives', function () {
        let sotPassiveChar = Object.assign([], baseCharacter);
        sotPassiveChar.startOfTurn = function () {
            // @ts-ignore
            this.turnStats.percentageStartOfTurnAttack = 0.5
        }
        let sotPassiveConfig = Object.assign([], config);
        sotPassiveConfig.percentageStartOfTurnAttack = 0.3;

        let result = DokkanSimulator.singleCharacterSimulation(sotPassiveChar, sotPassiveConfig)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 18000);
    });
    it('should modify attack by flat start of turn passives', function () {
        let sotFlatPassiveChar = Object.assign([], baseCharacter);
        sotFlatPassiveChar.startOfTurn = function () {
            // @ts-ignore
            this.turnStats.flatStartOfTurnAttack = 1000
        }
        let sotFlatPassiveConfig = Object.assign([], config);
        sotFlatPassiveConfig.flatStartOfTurnAttack = 3000;

        let result = DokkanSimulator.singleCharacterSimulation(sotFlatPassiveChar, sotFlatPassiveConfig)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 14000);
    });
    it('should modify attack by leaderskills AND start of turn passives', function () {
        let mixedConfig = Object.assign([], config);
        mixedConfig.leaderSkill1 = function (char: any) {
            // 27,000
            char.turnStats.percentageLeaderAttack += 1.7;
            // 32,000
            char.turnStats.flatLeaderAttack += 5000;
            return char
        }
        // 105,600
        mixedConfig.percentageStartOfTurnAttack = 2.3;

        let mixedChar = Object.assign([], baseCharacter);
        mixedChar.startOfTurn = function () {
            // @ts-ignore
            this.turnStats.percentageStartOfTurnAttack = 2      // 169,600
            // @ts-ignore
            this.turnStats.flatStartOfTurnAttack = 1000     // 170,600
        }
        // 173,600
        mixedConfig.flatStartOfTurnAttack = 3000;

        let result = DokkanSimulator.singleCharacterSimulation(mixedChar, mixedConfig)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 173600);
    });
    it('should modify attack by percentage nuking passives', function () {
        let nukePassiveChar = Object.assign([], baseCharacter);
        nukePassiveChar.collectKiSpheres = function (collectedKiSpheres: kiSpheres) {
            let kiBoost = 0;
            Object.entries(collectedKiSpheres).forEach(
                ([key, value]) => {
                    kiBoost += value;
                    this.turnStats.percentageStartOfTurnAttack += this.turnStats.percentageKiSphereAttack[key] * value
                });
            kiBoost += collectedKiSpheres.TEQ
        }

        let nukePassiveConfig = Object.assign([], config);
        nukePassiveConfig.percentageObtainKiSphereAttack = { TEQ: 0.1, AGL: 0.2, STR: 0.3, PHY: 0.4, INT: 0.5, RBW: 0.6 };

        let result = DokkanSimulator.singleCharacterSimulation(nukePassiveChar, nukePassiveConfig)
        // section finds the number of orbs actually collected to allow them to be randomised but still work for the test
        let expectedAttackBoost: number = 0
        // @ts-ignore
        Object.entries(result.turnData["turn 1"].kiSpheres).forEach(([key, value]) =>
            // @ts-ignore
            expectedAttackBoost += nukePassiveConfig.percentageObtainKiSphereAttack[key] * value
        )
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, nukePassiveChar.baseAttack * (1 + expectedAttackBoost));
    });
    it('should modify attack by flat nuking passives', function () {
        let nukeFlatPassiveChar = Object.assign([], baseCharacter);
        nukeFlatPassiveChar.collectKiSpheres = function (collectedKiSpheres: kiSpheres) {
            let kiBoost = 0;
            Object.entries(collectedKiSpheres).forEach(
                ([key, value]) => {
                    kiBoost += value;
                    this.turnStats.flatStartOfTurnAttack += this.turnStats.flatKiSphereAttack[key] * value
                });
            kiBoost += collectedKiSpheres.TEQ
        }

        let nukePassiveConfig = Object.assign([], config);
        nukePassiveConfig.flatObtainKiSphereAttack = { TEQ: 10, AGL: 205, STR: 3000, PHY: 4000, INT: 50000, RBW: 6 };

        let result = DokkanSimulator.singleCharacterSimulation(nukeFlatPassiveChar, nukePassiveConfig)
        // section finds the number of orbs actually collected to allow them to be randomised but still work for the test
        let expectedAttackBoost: number = 0
        // @ts-ignore
        Object.entries(result.turnData["turn 1"].kiSpheres).forEach(([key, value]) =>
            // @ts-ignore
            expectedAttackBoost += nukePassiveConfig.flatObtainKiSphereAttack[key] * value
        )
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, nukeFlatPassiveChar.baseAttack + expectedAttackBoost);
    });

});

//     it('should have attack modified by the  links', function () {
//         let linksCharacter = Object.assign({}, baseCharacter);
//         linksCharacter.links = [{ "Super Saiyan": function (char: any) { char.turnStats.percentageLinksBoostAttack += 2.1 } }]



//         let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
//         // console.log(result);

//         // equal(Object.keys(result.turnData).length, expectedAppearances);
//     });


