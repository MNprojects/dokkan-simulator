export abstract class DokkanSimulator {

    static singleCharacterSimulation(character: Character, configOptions: SimConfiguration): (SimResults) {
        // TODO: validate input
        validateCharacter(character);
        validateConfig(configOptions);
        let results: SimResults = { summary: {}, turnData: {}, team: {}, config: {} }
        let turns = {};
        let appeared = 0;
        let teamArray: any[] = [0, 1, 3, 4, 2, 5, 6];
        let currentPosition = configOptions.startingPosition;
        let simCharacter: any = character
        simCharacter.battleStats = {
            stackAttack: 0,
            attackPerAttackPerformed: 0,
            attackPerAttackReceived: 0,
            attackPerAttackEvaded: 0,
            attackPerTurn: 0,
            attackPerEnemy: 0,
            attackPerFinalBlow: 0
        }

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
                currentPosition = currentRotation[configOptions.desiredPosition];
                resetTurnStats(simCharacter);
                // Collect Ki Spheres
                let collectedKiSpheres = findBestKiSphereCollection(simCharacter, configOptions);

                // add results to turnData
                let turnName: string = 'turn ' + turn;
                // @ts-ignore
                turns[turnName] = {
                    appearanceCount: appeared,
                    kiSpheres: collectedKiSpheres,
                    attacks: {}
                }
                // Attack loop
                let attackCount = 1;
                // TODO: refactor to a single attack loop rather than all this additionals work
                let additionalAttacks: string[] = simCharacter.passiveAdditionalAttacks(configOptions)
                additionalAttacks = Object.values(additionalAttacks)
                let attack = attackLoop(simCharacter, configOptions, collectedKiSpheres);

                // @ts-ignore
                turns[turnName].attacks[attackCount] = attack;

                let additional = calculateAdditionalAttack(simCharacter, attackCount)

                if (additional !== undefined) {
                    additionalAttacks.push(additional)
                }

                additionalAttacks.forEach(additional => {
                    resetTurnStats(simCharacter);
                    if (additional === "super") {
                        attack = attackLoop(simCharacter, configOptions, collectedKiSpheres, true);
                    } else if (additional === "normal") {
                        attack = attackLoop(simCharacter, configOptions, collectedKiSpheres, false);
                    }
                    attackCount++
                    // @ts-ignore
                    turns[turnName].attacks[attackCount] = attack;
                });
            }
        }
        results.turnData = turns
        return results


    }
}
function attackLoop(simCharacter: any, configOptions: SimConfiguration, collectedKiSpheres: kiSpheres, superAdditional?: boolean) {

    // Percentage - based leader skills - done
    // Flat leader skills - done
    simCharacter = configOptions.leaderSkill1(simCharacter);
    simCharacter = configOptions.leaderSkill2(simCharacter);

    // Percentage - based start of turn passives - done
    // This is where start of turn + ATK support passives go. - done
    // This is also where nuking style passives are factored in. - done
    // Flat start of turn passives - done

    simCharacter.startOfTurn();
    applyConfigPassives(configOptions, simCharacter);
    simCharacter.collectKiSpheres(collectedKiSpheres);

    // Links - even if they say they don't activate until the unit supers (such as Kamehameha).
    activateLinks(simCharacter, configOptions.activeLinks);

    // Ki multiplier
    simCharacter.calculateKiMultiplier();

    // Build - up passives
    // On Attack / on SA percentage - based passives
    // On Attack / on SA flat passives
    simCharacter.onAttack();

    // SA multiplier
    // SA - based ATK increases are factored in here as flat additions to the SA multiplier

    simCharacter.turnStats.superAttackDetails = selectSuperAttack(simCharacter, superAdditional!);
    simCharacter.turnStats.attackModifier = calculateAttackModifier(simCharacter, configOptions)
    simCharacter.turnStats.currentAttack = calculateCurrentAttack(simCharacter, configOptions);

    return simCharacter.turnStats.currentAttack
}

export interface Character {
    name: string,
    type: Type,
    startOfTurn?(): void,
    collectKiSpheres?(kiSpheres: kiSpheres): void,
    passiveAdditionalAttacks?(): string[],
    baseAttack: number,
    categories: string[],
    links: {}[],
    additionalAttackChance: number,
    criticalChance: number,
    calculateKiMultiplier?(): void,
    onAttack?(): void,
    superAttacks: {}[]

}

function validateCharacter(character: Character) {

}

function validateConfig(config: SimConfiguration) {

}


function resetTurnStats(character: any) {
    character.turnStats = {
        currentAttack: character.baseAttack,
        percentageLeaderAttack: 0,
        flatLeaderAttack: 0,
        currentKi: 0,
        currentKiMultiplier: 0,
        percentageStartOfTurnAttack: 0,
        flatStartOfTurnAttack: 0,
        percentageLinksAttack: 0,
        percentageKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        flatKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        superAttackDetails: {
            multiplier: 0.0,
            attackRaise: {},
            extraCritChance: 0,
            disableGuard: false,
            stun: {},
            seal: {},
            effectiveAgainstAll: false,
            debuffTargetDEF: {}
        },
        additionalAttack: false,
        attackModifier: 0,
        attackEffectiveToAll: false,

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

export enum Type {
    TEQ = "TEQ",
    INT = "INT",
    PHY = "PHY",
    STR = "STR",
    AGL = "AGL",
}

function activateLinks(character: any, activeLinks: string[]) {
    character.links.forEach((link: any) => {
        if (activeLinks.includes(Object.keys(link)[0])) {
            // @ts-ignore
            Object.values(link)[0](character)
        }
    });
}

function calculateAttackModifier(simCharacter: any, config: SimConfiguration): number {
    const rng = Math.random();
    // Separate chances to crit based on Hidden Potential and passives
    if (rng < simCharacter.turnStats.criticalChance || rng < simCharacter.criticalChance) {
        return 0.875
    } else if (simCharacter.turnStats.attackEffectiveToAll) {
        return 0.5
    } else {
        return 0;
    }
}

function calculateCurrentAttack(simCharacter: any, config: SimConfiguration): number {
    const stats = simCharacter.turnStats
    const battleStats = simCharacter.battleStats
    const attackAfterLeaderSkills = Math.floor(stats.currentAttack * (1 + stats.percentageLeaderAttack) + stats.flatLeaderAttack);
    const attackAfterStartOfTurn = Math.floor(attackAfterLeaderSkills * (1 + stats.percentageStartOfTurnAttack + config.percentageStartOfTurnAttack) + stats.flatStartOfTurnAttack + config.flatStartOfTurnAttack);
    const attackAfterLinks = Math.floor(attackAfterStartOfTurn * (1 + stats.percentageLinksAttack));
    const attackAfterKiMultiplier = Math.floor(attackAfterLinks * (1 + stats.currentKiMultiplier)); // TODO: For not super attacks?
    const attackAfterStacking = Math.floor(attackAfterKiMultiplier * (1 + battleStats.stackAttack + battleStats.attackPerAttackPerformed + battleStats.attackPerAttackReceived + battleStats.attackPerAttackEvaded + battleStats.attackPerTurn + battleStats.attackPerEnemy + battleStats.attackPerFinalBlow))
    const attackAfterSAMultiplier = Math.floor(attackAfterStacking * (1 + stats.superAttackDetails.multiplier))
    const attackAfterModifier = Math.floor(attackAfterSAMultiplier * (1 + stats.attackModifier))

    return attackAfterModifier
}



function findBestKiSphereCollection(simCharacter: any, turnConfig: SimConfiguration): kiSpheres {
    // TODO actually implement something - should probably simulate calc the attack from a few different options to mimic user choices on board
    // TODO (but team sim need to lower chances based on what is actually taken to not favour mono teams)
    return { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 1 }
}

function applyConfigPassives(configOptions: SimConfiguration, simCharacter: any) {
    simCharacter.turnStats.percentageKiSphereAttack = configOptions.percentageObtainKiSphereAttack
    console.log(simCharacter.turnStats.percentageKiSphereAttack);

    simCharacter.turnStats.flatKiSphereAttack = configOptions.flatObtainKiSphereAttack
}
// TODO: builder pattern for config and character?

function selectSuperAttack(simChar: any, superAdditional?: boolean) {
    let highestSANum = 0;
    let saDetails;

    if (superAdditional) {
        highestSANum = 24
        simChar.superAttacks.forEach((superAttack: any) => {
            if (simChar.turnStats.currentKi >= parseInt(Object.keys(superAttack)[0]) && parseInt(Object.keys(superAttack)[0]) <= highestSANum) {
                highestSANum = parseInt(Object.keys(superAttack)[0]);
                saDetails = Object.values(superAttack)[0]

            }
        });
    } else {
        simChar.superAttacks.forEach((superAttack: any) => {
            if (simChar.turnStats.currentKi >= parseInt(Object.keys(superAttack)[0]) && parseInt(Object.keys(superAttack)[0]) >= highestSANum) {
                highestSANum = parseInt(Object.keys(superAttack)[0]);
                saDetails = Object.values(superAttack)[0]
            }
        });
    }

    // if no Ki threshold is reached
    if (saDetails === undefined) {
        saDetails = {
            multiplier: 0
        }
    }

    return saDetails;
}

function calculateAdditionalAttack(simCharacter: any, chances: number) {
    let rng = Math.random()
    for (let index = 0; index < chances; index++) {
        if (simCharacter.additionalAttackChance >= rng) {
            if (rng > 0.49) {
                return "super"
            } else {
                return "normal"
            }
        }
    }
    return
}

