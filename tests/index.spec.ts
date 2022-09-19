import { DokkanSimulator, Character, SimConfiguration } from '../src/dokkanSimulator';
import { deepEqual, equal } from "assert";


describe('Single Character Simulation', function () {
    it('should have the same number of turns as given in the config', function () {
        let expectedAppearances = 4
        let character: Character =
        {
            name: 'Test',
            startOfTurn() {
                console.log('functiontest');
            },
            baseAttack: 10000,
            categories: ["Super Saiyan"],
            links: [{ "Super Saiyan": function (char: any) { char.turnStats.percentageLinksBoostAttack += 2.1} }],
        }
        let config: SimConfiguration = {
            appearances: expectedAppearances,
            startingPosition: 3,
            desiredPosition: 1,
            leaderSkill1(char: any) {
                if (char.categories.includes("Super Saiyan")) {
                    char.turnStats.percentageLeaderAttack += 1.7;
                    char.turnStats.kiBoost += 3
                }

            },
            leaderSkill2(char: any) {
                if (char.categories.includes("Super Saiyan")) {
                    char.turnStats.percentageLeaderAttack += 1.7;
                    char.turnStats.kiBoost += 3
                }
            },
            percentageStartOfTurnAttack: 0.4,
            flatStartOfTurnAttack: 0,
            activeLinks: ["Super Saiyan"],
        }
        let result = DokkanSimulator.singleCharacterSimulation(character, config)
        console.log(result);

        equal(Object.keys(result.turnData).length, expectedAppearances);
    });
});

