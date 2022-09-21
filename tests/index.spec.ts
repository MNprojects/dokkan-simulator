import { DokkanSimulator, Character, SimConfiguration } from '../src/dokkanSimulator';
import { deepEqual, equal } from "assert";

let baseCharacter: Character;
let config: SimConfiguration;

before(function () {
    baseCharacter =
    {
        name: 'Test',
        startOfTurn() { },
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
        percentageStartOfTurnAttack: 0.4,
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

    it('should have an attack with no modifiers in the results', function () {
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, baseCharacter.baseAttack);
    });

    it('should have attack modified by the percentage leaderskills', function () {
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
    it('should have attack modified by the flat and percentage leaderskills', function () {
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
        // console.log(result);
        // @ts-ignore
        equal(result.turnData["turn 1"].attack, 57000);
    });
});

//     it('should have attack modified by the  links', function () {
//         let linksCharacter = Object.assign({}, baseCharacter);
//         linksCharacter.links = [{ "Super Saiyan": function (char: any) { char.turnStats.percentageLinksBoostAttack += 2.1 } }]



//         let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
//         // console.log(result);

//         // equal(Object.keys(result.turnData).length, expectedAppearances);
//     });


