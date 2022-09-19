export abstract class DokkanSimulator {

    static singleCharacterSimulation(character: Character, configOptions: SimConfiguration): (SimResults) {
        // TODO: validate input
        let results: SimResults = { summary: {}, turnData: {}, team: {}, config: {} }
        let turns = {};
        let appeared = 0;
        let teamArray: any[] = [0, 1, 3, 4, 2, 5, 6];
        let currentPosition = configOptions.startingPosition;
        let simCharacter: any = character

        for (let turn = 1; appeared < configOptions.appearances; turn++) {
            let currentRotation: any[] = []
            // set which character slots are on rotation
            if (turn % 2 === 0) {
                currentRotation = currentRotation.concat(teamArray[2]).concat(teamArray[3]).concat(teamArray[((turn - 1) % 3) + 4]);
            }
            else {
                currentRotation = currentRotation.concat(teamArray[0]).concat(teamArray[1]).concat(teamArray[((turn - 1) % 3) + 4]);
            }

            // if the sim character is on rotation
            if (currentRotation.includes(currentPosition)) {
                appeared++;
                currentPosition = currentRotation[configOptions.desiredPosition]
                resetTurnStats(simCharacter);
                configOptions.leaderSkill1(simCharacter);
                configOptions.leaderSkill2(simCharacter);
                simCharacter.startOfTurn()
                simCharacter.turnStats.percentageStartOfTurnAttack += configOptions.percentageStartOfTurnAttack
                activateLinks(simCharacter, configOptions.activeLinks)
                console.log(simCharacter);

                // Percentage - based leader skills
                // Flat leader skills
                // Percentage - based start of turn passives
                // This is where start of turn + ATK support passives go.
                // This is also where nuking style passives are factored in.
                // Flat start of turn passives
                // Percentage - based links
                // Flat links
                // All flat links are added in here, even if they say they don't activate until the unit supers (such as Kamehameha).
                // Ki multiplier
                // Build - up passives
                // On Attack / on SA percentage - based passives
                // On Attack / on SA flat passives
                // SA multiplier
                // SA - based ATK increases are factored in here as flat additions to the SA multiplier
                character.startOfTurn();
                let turnName: string = 'turn ' + turn;

                // add results to turnData
                // @ts-ignore
                turns[turnName] = {
                    appearanceCount: appeared
                };
                // reset
            }
        }
        results.turnData = turns

        return results
    }
}


export interface Character {
    name: string,
    startOfTurn(): any,
    baseAttack: number,
    categories: string[],
    links: {}[],
}


function resetTurnStats(character: any) {
    character.turnStats = {
        currentAttack: character.baseAttack,
        percentageLeaderAttack: 1,
        flatLeaderAttack: 0,
        kiBoost: 0,
        percentageStartOfTurnAttack: 1,
        flatStartOfTurnAttack: 0,
        percentageLinksBoostAttack: 1,
    }
}

export interface SimConfiguration {
    appearances: number,
    startingPosition: number,
    desiredPosition: number,
    leaderSkill1(char: Character): void,
    leaderSkill2(char: Character): void,
    percentageStartOfTurnAttack: number,
    flatStartOfTurnAttack: number,
    activeLinks: string[]

}

interface SimResults {
    summary: Object,
    turnData: Object,
    team: Object,
    config: Object
}



function activateLinks(character: any, activeLinks: string[]) {
    character.links.forEach((link: any) => {
        if (activeLinks.includes(Object.keys(link)[0])) {
            // @ts-ignore
            Object.values(link)[0](character)
        }
    });
}
// TODO: builder pattern for config and character?

