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
                // Percentage - based leader skills - done
                // Flat leader skills - done
                simCharacter = configOptions.leaderSkill1(simCharacter);
                simCharacter = configOptions.leaderSkill2(simCharacter);

                // Percentage - based start of turn passives - done
                // This is where start of turn + ATK support passives go. - done
                // This is also where nuking style passives are factored in. - done
                // Flat start of turn passives - done
                simCharacter.startOfTurn()
                applyConfigPassives(configOptions, simCharacter)
                let collectedKiSpheres = findBestKiSphereCollection(simCharacter, configOptions)
                simCharacter.collectKiSpheres(collectedKiSpheres)

                // Links - even if they say they don't activate until the unit supers (such as Kamehameha).
                activateLinks(simCharacter, configOptions.activeLinks)


                // Ki multiplier
                // Build - up passives
                // On Attack / on SA percentage - based passives
                // On Attack / on SA flat passives
                // SA multiplier
                // SA - based ATK increases are factored in here as flat additions to the SA multiplier
                // simCharacter.startOfTurn();

                simCharacter.turnStats.currentAttack = calculateCurrentAttack(simCharacter, configOptions)
                // console.log('here');
                // simCharacter.attack();
                let turnName: string = 'turn ' + turn;
                // add results to turnData
                // @ts-ignore
                turns[turnName] = {
                    appearanceCount: appeared,
                    attack: simCharacter.turnStats.currentAttack,
                    kiSpheres: collectedKiSpheres,
                };
                // reset
            }
        }
        results.turnData = turns
        // console.log(results);

        return results
    }
}


export interface Character {
    name: string,
    type: string,
    startOfTurn(): void,
    collectKiSpheres(kiSpheres: kiSpheres): void,
    baseAttack: number,
    categories: string[],
    links: {}[],
}


function resetTurnStats(character: any) {
    character.turnStats = {
        currentAttack: character.baseAttack,
        percentageLeaderAttack: 0,
        flatLeaderAttack: 0,
        kiBoost: 0,
        percentageStartOfTurnAttack: 0,
        flatStartOfTurnAttack: 0,
        percentageLinksBoostAttack: 0,
        percentageKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        flatKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
    }
}

export interface SimConfiguration {
    appearances: number,
    startingPosition: number,
    desiredPosition: number,
    leaderSkill1(char: Character): any,
    leaderSkill2(char: Character): any,
    percentageStartOfTurnAttack: number,
    flatStartOfTurnAttack: number,
    activeLinks: string[]
    percentageObtainKiSphereAttack: kiSpheres,
    flatObtainKiSphereAttack: kiSpheres,

}
export interface kiSpheres {
    TEQ: number,
    AGL: number,
    STR: number,
    PHY: number,
    INT: number,
    RBW: number
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

function calculateCurrentAttack(simCharacter: any, config: SimConfiguration): number {
    let stats = simCharacter.turnStats
    let result = ((stats.currentAttack * (1 + stats.percentageLeaderAttack) + stats.flatLeaderAttack)
        * (1 + stats.percentageStartOfTurnAttack + config.percentageStartOfTurnAttack)
        + stats.flatStartOfTurnAttack + config.flatStartOfTurnAttack)
        * (1 + stats.percentageLinksBoostAttack);
    return result
}



function findBestKiSphereCollection(simCharacter: any, turnConfig: SimConfiguration): kiSpheres {
    // TODO actually implement something - should probably calc the attack from a few different options to mimic user choices on board
    // TODO (but team sim need to lower chances based on what is actually taken to not favour mono teams)
    return { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 1 }
}

function applyConfigPassives(configOptions: SimConfiguration, simCharacter: any) {
    simCharacter.turnStats.percentageKiSphereAttack = configOptions.percentageObtainKiSphereAttack
    simCharacter.turnStats.flatKiSphereAttack = configOptions.flatObtainKiSphereAttack
}
// TODO: builder pattern for config and character?

