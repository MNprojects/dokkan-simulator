
export interface GameState {
    turn: number,
    teamArray: number[]
    currentRotation: number[],
    leaderSkill1(char: Character): void,
    leaderSkill2(char: Character): void,
    enemies: any[], // TODO: Actual enemies with names/categories. Different phases?
    // TODO: Items? Support Memories?
}

export abstract class DokkanSimulator {
    static singleCharacterSimulation(character: Character, configOptions: SimConfiguration): (SimResults) {
        validateCharacter(character);
        validateConfig(configOptions);
        let gameState: GameState = {
            turn: 1,
            teamArray: [0, 1, 3, 4, 2, 5, 6],
            currentRotation: [0, 1, 2],
            leaderSkill1: configOptions.leaderSkill1,
            leaderSkill2: configOptions.leaderSkill2,
            enemies: [{ name: "test enemy" }]
        }
        let results: SimResults = { summary: {}, turnData: {}, team: {}, config: {} }
        let turns = {};
        let currentPosition = configOptions.startingPosition;
        let simCharacter: any = character
        simCharacter.battleStats = {
            appearances: 0,
            stackAttack: 0,
            attackPerAttackPerformed: 0,
            attackPerAttackReceived: 0,
            attackPerAttackEvaded: 0,
            attackPerTurn: 0,
            attackPerEnemy: 0,
            attackPerFinalBlow: 0
        }

        for (gameState.turn; simCharacter.battleStats.appearances < configOptions.appearances; gameState.turn++) {

            // set which character slots are on rotation
            if (gameState.turn % 2 === 0) {
                gameState.currentRotation = [gameState.teamArray[2], gameState.teamArray[3], gameState.teamArray[((gameState.turn - 1) % 3) + 4]];
            }
            else {
                gameState.currentRotation = [gameState.teamArray[0], gameState.teamArray[1], gameState.teamArray[((gameState.turn - 1) % 3) + 4]];
            }

            // if the sim character is on rotation
            if (gameState.currentRotation.includes(currentPosition)) {
                simCharacter.battleStats.appearances++;
                currentPosition = gameState.currentRotation[configOptions.desiredPosition];
                resetTurnStats(simCharacter);
                evalTurnBasedBuffs(character, gameState);
                // Collect Ki Spheres
                let collectedKiSpheres = findBestKiSphereCollection(simCharacter, configOptions);

                // add results to turnData
                let turnName: string = 'turn ' + gameState.turn;
                // @ts-ignore
                turns[turnName] = {
                    appearanceCount: simCharacter.battleStats.appearances,
                    KiSpheres: collectedKiSpheres,
                    attacks: {}
                }

                // Attack loop
                let attackCount = 1;
                // TODO: refactor to a single attack loop rather than all this additionals work
                let additionalAttacks: string[] = simCharacter.passiveAdditionalAttacks(gameState)
                additionalAttacks = Object.values(additionalAttacks)
                let attack = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState);

                // @ts-ignore
                turns[turnName].attacks[attackCount] = attack;

                let additional = calculateAdditionalAttack(simCharacter, attackCount)

                if (additional !== undefined) {
                    additionalAttacks.push(additional)
                }

                additionalAttacks.forEach(additional => {
                    resetTurnStats(simCharacter);
                    if (additional === "super") {
                        attack = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState, true);
                    } else if (additional === "normal") {
                        attack = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState, false);
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

function attackLoop(simCharacter: any, configOptions: SimConfiguration, collectedKiSpheres: KiSpheres, gameState: GameState, superAdditional?: boolean) {

    // Percentage - based leader skills - done
    // Flat leader skills - done
    gameState.leaderSkill1(simCharacter);
    gameState.leaderSkill2(simCharacter);

    // Percentage - based start of turn passives - done
    // This is where start of turn + ATK support passives go. - done
    // This is also where nuking style passives are factored in. - done
    // Flat start of turn passives - done
    simCharacter.startOfTurn(gameState);
    applyConfigPassives(configOptions, simCharacter);
    simCharacter.collectKiSpheres(collectedKiSpheres, gameState);
    collectKiSpheres(simCharacter, collectedKiSpheres)

    // Links - even if they say they don't activate until the unit supers (such as Kamehameha).
    activateLinks(simCharacter, configOptions.activeLinks);

    // Ki multiplier
    simCharacter.calculateKiMultiplier();

    // Build - up passives
    // On Attack / on SA percentage - based passives
    // On Attack / on SA flat passives
    simCharacter.onAttack(gameState);

    // SA multiplier
    // SA - based ATK increases are factored in here as flat additions to the SA multiplier

    simCharacter.turnStats.superAttackDetails = selectSuperAttack(simCharacter, superAdditional!);
    superAttackEffects(simCharacter.turnStats.superAttackDetails, simCharacter);
    simCharacter.turnStats.attackModifier = calculateAttackModifier(simCharacter, configOptions)
    simCharacter.turnStats.currentAttack = calculateCurrentAttack(simCharacter, configOptions);
    afterAttack(simCharacter, gameState)
    return simCharacter.turnStats.currentAttack
}

export interface Character {
    name: string,
    title: string,
    type: Type,
    startOfTurn?(gameState: GameState): void,
    collectKiSpheres?(kiSpheres: KiSpheres, gameState: GameState): void, // only for rules specific to the character
    passiveAdditionalAttacks?(gameState: GameState): string[], //TODO: type rather than string
    baseAttack: number,
    maxKi: number,
    categories: string[],
    links: {}[], //TODO: type definition
    additionalAttackChance: number,
    criticalChance: number,
    calculateKiMultiplier?(): void,
    onAttack?(gameState: GameState): void,
    superAttacks: {}[], //TODO: type definition
    turnStats: {
        percentageStartOfTurnAttackBuffs: Buff[],
        attackEffectiveToAll: boolean,
        criticalChance: number,
        currentKi: number,
        currentKiMultiplier: number,
        flatStartOfTurnAttack: number,
        percentageKiSphereAttack: KiSpheres,
        flatKiSphereAttack: KiSpheres,
        kiSphereBuffs: any[],
        SABuffs: Buff[],
        disableGuard: boolean,
        superAttackDetails: any,
    },
    battleStats: {
        appearances: number,
        stackAttack: number,
        attackPerAttackPerformed: number,
        attackPerAttackReceived: number,
        attackPerAttackEvaded: number,
        attackPerTurn: number,
        attackPerEnemy: number,
        attackPerFinalBlow: number,
    },
}

function validateCharacter(character: Character) {
    if (character.baseAttack < 0) {
        throw new Error("base attack must be a positive number");
    }
    // TODO Max Ki
}

function evalTurnBasedBuffs(character: Character, gameState: GameState) {
    character.turnStats.percentageStartOfTurnAttackBuffs = character.turnStats.percentageStartOfTurnAttackBuffs.filter(buff => buff.turnBuffExpires > gameState.turn)
    character.turnStats.kiSphereBuffs = character.turnStats.kiSphereBuffs.filter(buff => buff.turnBuffExpires > gameState.turn)
}
interface Buff {
    amount: number,
    turnBuffExpires: number
}

// TODO : rename to endOfTurn?
function resetTurnStats(character: any) {
    character.turnStats = {
        currentAttack: character.baseAttack,
        percentageLeaderAttack: 0,
        flatLeaderAttack: 0,
        currentKi: 0,
        currentKiMultiplier: 0,
        flatStartOfTurnAttack: 0,
        percentageLinksAttack: 0,
        percentageKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        flatKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        superAttackDetails: { // TODO Remove
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
        percentageStartOfTurnAttackBuffs: character.turnStats.percentageStartOfTurnAttackBuffs,
        kiSphereBuffs: character.turnStats.kiSphereBuffs,
        SABuffs: character.turnStats.SABuffs,
        disableGuard: false,
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
    percentageObtainKiSphereAttack: KiSpheres,
    flatObtainKiSphereAttack: KiSpheres,
}

function validateConfig(config: SimConfiguration) {
    let errorMessages = "";
    if (config.appearances < 1) {
        errorMessages = errorMessages.concat("configuration.appearances: Simulated character must appear at least once. \r\n")
    }
    if (config.startingPosition < 0 || config.startingPosition > 5) {
        errorMessages = errorMessages.concat("configuration.startingPosition: Starting Position must be between 0 and 5. \r\n")
    }
    if (config.desiredPosition < 0 || config.desiredPosition > 5) {
        errorMessages = errorMessages.concat("configuration.desiredPostion: Desired Position must be between 0 and 5. \r\n")
    }

    if (errorMessages != "") {
        throw new Error(errorMessages);
    }
}

// doesn't account for candies etc
export interface KiSpheres {
    TEQ: number,
    AGL: number,
    STR: number,
    PHY: number,
    INT: number,
    RBW: number
}

// standard rules that are true for every character
function collectKiSpheres(character: Character, kiSpheres: KiSpheres) {
    let kiBoost = 0;
    // add 1 per ki sphere regardless of type (doesn't account for candies etc)
    Object.values(kiSpheres).forEach(value => kiBoost += value);
    // add 1 for ki spheres that match character type
    kiBoost += Object.entries(kiSpheres).filter(sphereType => sphereType[0] === character.type)[0][1]

    if (character.turnStats.currentKi + kiBoost >= character.maxKi) {
        character.turnStats.currentKi = character.maxKi;
    } else {
        character.turnStats.currentKi += kiBoost;
    }
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
    const turnstats = simCharacter.turnStats
    const battleStats = simCharacter.battleStats
    const attackAfterLeaderSkills = Math.floor(turnstats.currentAttack * (1 + turnstats.percentageLeaderAttack) + turnstats.flatLeaderAttack);
    const SOTBuffs = simCharacter.turnStats.percentageStartOfTurnAttackBuffs.reduce((acc: any, value: any) => {
        acc = acc + value.amount;
        return acc;
    }, 0);
    const attackAfterStartOfTurn = Math.floor(attackAfterLeaderSkills * (1 + SOTBuffs + config.percentageStartOfTurnAttack) + turnstats.flatStartOfTurnAttack + config.flatStartOfTurnAttack);
    const attackAfterLinks = Math.floor(attackAfterStartOfTurn * (1 + turnstats.percentageLinksAttack));
    const attackAfterKiMultiplier = Math.floor(attackAfterLinks * (1 + turnstats.currentKiMultiplier)); // TODO: For not super attacks?
    const attackAfterStacking = Math.floor(attackAfterKiMultiplier * (1 + battleStats.stackAttack + battleStats.attackPerAttackPerformed + battleStats.attackPerAttackReceived + battleStats.attackPerAttackEvaded + battleStats.attackPerTurn + battleStats.attackPerEnemy + battleStats.attackPerFinalBlow))
    const SABuffs = simCharacter.turnStats.SABuffs.reduce((accumulator: number, currentValue: any) => {
        accumulator = accumulator + currentValue.amount;
        return accumulator
    }, 0);
    const attackAfterSAMultiplier = Math.floor(attackAfterStacking * (1 + turnstats.superAttackDetails.multiplier + SABuffs))
    const attackAfterModifier = Math.floor(attackAfterSAMultiplier * (1 + turnstats.attackModifier))

    return attackAfterModifier
}



function findBestKiSphereCollection(simCharacter: any, turnConfig: SimConfiguration): KiSpheres {
    // TODO actually implement something - should probably simulate calc the attack from a few different options to mimic user choices on board
    // TODO (but team sim need to lower chances based on what is actually taken to not favour mono teams)
    return { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 1 }
}

function applyConfigPassives(configOptions: SimConfiguration, simCharacter: any) {
    simCharacter.turnStats.percentageKiSphereAttack = configOptions.percentageObtainKiSphereAttack
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
    const rng = Math.random()
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

function superAttackEffects(superAttackDetails: any, character: Character) {
    if (superAttackDetails.extraCritChance) {
        character.turnStats.criticalChance += superAttackDetails.extraCritChance;
    }
    if (superAttackDetails.disableGuard) { // Not used right now
        character.turnStats.disableGuard = true;
    }
    if (superAttackDetails.effectiveAgainstAll) {
        character.turnStats.attackEffectiveToAll = true;
    }

}

function afterAttack(simCharacter: Character, gameState: GameState) {
    if (simCharacter.turnStats.superAttackDetails.attackBuff) {
        
    }
}

