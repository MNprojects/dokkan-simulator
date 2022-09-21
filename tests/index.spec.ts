import { DokkanSimulator, Character, SimConfiguration } from '../src/dokkanSimulator';
import { deepEqual, equal } from "assert";

let baseCharacter: Character;
let config: SimConfiguration;

before(function () {
    baseCharacter =
    {
        name: 'Test',
        startOfTurn(char: any) { return char },
        baseAttack: 10000,
        categories: [],
        links: [],
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
        
        // 172,600
        mixedConfig.flatStartOfTurnAttack = 3000;
        let mixedChar = Object.assign([], baseCharacter);
        mixedChar.startOfTurn = function () {
            // @ts-ignore
            this.turnStats.percentageStartOfTurnAttack = 2      // 169,600
            // @ts-ignore
            this.turnStats.flatStartOfTurnAttack = 1000     // 173,600
        }

        let result = DokkanSimulator.singleCharacterSimulation(mixedChar, mixedConfig)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 173600);
    });

});

//     it('should have attack modified by the  links', function () {
//         let linksCharacter = Object.assign({}, baseCharacter);
//         linksCharacter.links = [{ "Super Saiyan": function (char: any) { char.turnStats.percentageLinksBoostAttack += 2.1 } }]



//         let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
//         // console.log(result);

//         // equal(Object.keys(result.turnData).length, expectedAppearances);
//     });


