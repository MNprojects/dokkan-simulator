import { Character, SimConfiguration, KiSpheres, GameState, SimResults, Type, Class, TurnData } from './types';


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
            enemies: [{
                name: "test enemy", type: Type.TEQ,
                class: Class.Extreme,
                categories: [],
                sealed: false,
                stunned: false,
            }]

        }
        let results: SimResults = {
            summary: {
                averageAttackPerTurn: 0,
                decimalOfAttacksThatCrit: 0,
                decimalOfTurnsWithAdditional: 0
            },
            turnData: [], team: {}, config: {}
        }
        let currentPosition = configOptions.startingPosition;
        let simCharacter: Character = character

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

                let turn: TurnData = {
                    turn: gameState.turn,
                    appearanceCount: simCharacter.battleStats.appearances,
                    kiSpheres: collectedKiSpheres,
                    attacks: []
                }

                // Attack loop
                let attackCount = 1;

                // TODO: refactor to a single attack loop rather than all this additionals work
                simCharacter.passiveAdditionalAttacks(gameState)
                let [attack, critical] = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState);
                turn.attacks.push({ count: 1, attack: attack, critical: critical })

                let additional = calculateAdditionalAttack(simCharacter, attackCount)

                if (additional !== undefined) {
                    simCharacter.turnStats.additionalAttacks.push(additional)
                }

                simCharacter.turnStats.additionalAttacks.forEach(additional => {
                    resetTurnStats(simCharacter);
                    if (additional === "super") {
                        [attack, critical] = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState, true);
                    } else if (additional === "normal") {
                        [attack, critical] = attackLoop(simCharacter, configOptions, collectedKiSpheres, gameState, false);
                    }
                    attackCount++
                    turn.attacks.push({ count: 1, attack: attack, critical: critical })
                });

                if (additional !== undefined) {
                    turn.attacks[turn.attacks.length - 1].additional = true
                }
                results.turnData.push(turn)
            }
        }


        results.summary = calculateSummary(results)
        return results
    }
}

function attackLoop(simCharacter: Character, configOptions: SimConfiguration, collectedKiSpheres: KiSpheres, gameState: GameState, superAdditional?: boolean): [number, boolean] {

    // Percentage - based leader skills - done
    // Flat leader skills - done
    gameState.leaderSkill1(simCharacter, gameState);
    gameState.leaderSkill2(simCharacter, gameState);

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
    simCharacter.turnStats.currentKiMultiplier = calculateKiMultiplier(simCharacter);

    // Build - up passives
    // On Attack / on SA percentage - based passives
    // On Attack / on SA flat passives
    simCharacter.onAttack(gameState);

    // SA multiplier
    // SA - based ATK increases are factored in here as flat additions to the SA multiplier
    simCharacter.turnStats.attackDetails = setAttackDetails(simCharacter, gameState, superAdditional!);
    superAttackEffects(simCharacter.turnStats.attackDetails, simCharacter);
    simCharacter.turnStats.attackModifier = calculateAttackModifier(simCharacter, configOptions)
    simCharacter.turnStats.currentAttack = calculateCurrentAttack(simCharacter, configOptions);
    afterAttack(simCharacter, gameState)
    if (simCharacter.turnStats.attackModifier === 0.875) {
        return [simCharacter.turnStats.currentAttack, true];
    } else {
        return [simCharacter.turnStats.currentAttack, false];
    }
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
        attackDetails: {
            kiThreshold: 0,
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
        criticalChance: 0,
        collectedKiSpheres: null,
        additionalAttacks: []
    }
}

function calculateSummary(results: SimResults) {
    let totalAttack = 0;
    let attackCount = 0;
    let critCount = 0;
    let additionalCount = 0;
    results.turnData.forEach(turn => {
        totalAttack += turn.attacks.reduce((accumulator, currentValue) => accumulator + currentValue.attack, 0)
        attackCount += turn.attacks.length
        critCount += turn.attacks.reduce((acc, cur) => acc + (cur.critical ? 1 : 0), 0)
        additionalCount += turn.attacks.filter(attack => attack.additional === true).length > 0 ? 1 : 0
    });
    return {
        averageAttackPerTurn: totalAttack / attackCount,
        decimalOfAttacksThatCrit: critCount / attackCount,
        decimalOfTurnsWithAdditional: additionalCount / results.turnData.length,
    }
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
// standard rules that are true for every character
function collectKiSpheres(character: Character, kiSpheres: KiSpheres) {
    let kiBoost = 0;
    character.turnStats.collectedKiSpheres = kiSpheres;
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

function activateLinks(character: any, activeLinks: string[]) {
    character.links.forEach((link: any) => {
        if (activeLinks.includes(link.name)) {
            link.linkFunction(character)
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
    const attackAfterKiMultiplier = Math.floor(attackAfterLinks * turnstats.currentKiMultiplier);
    const attackAfterStacking = Math.floor(attackAfterKiMultiplier * (1 + battleStats.stackAttack + battleStats.attackPerAttackPerformed + battleStats.attackPerAttackReceived + battleStats.attackPerAttackEvaded + battleStats.attackPerTurn + battleStats.attackPerEnemy + battleStats.attackPerFinalBlow))
    const SABuffs = simCharacter.turnStats.SABuffs.reduce((accumulator: number, currentValue: any) => {
        accumulator = accumulator + currentValue.amount;
        return accumulator
    }, 0);
    const attackAfterSAMultiplier = Math.floor(attackAfterStacking * (1 + turnstats.attackDetails.multiplier + SABuffs))
    const attackAfterModifier = Math.floor(attackAfterSAMultiplier * (1 + turnstats.attackModifier))

    return attackAfterModifier
}

function findBestKiSphereCollection(simCharacter: any, simConfig: SimConfiguration): KiSpheres {
    if (simConfig.setKiSpheresEveryTurn) {
        return simConfig.setKiSpheresEveryTurn
    }
    // TODO actually implement something - should probably simulate calc the attack from a few different options to mimic user choices on board
    // TODO (but team sim need to lower chances based on what is actually taken to not favour mono teams)
    return { TEQ: 0, AGL: 0, STR: 0, PHY: 10, INT: 0, RBW: 0 }
}

function applyConfigPassives(configOptions: SimConfiguration, simCharacter: any) {
    simCharacter.turnStats.percentageKiSphereAttack = configOptions.percentageObtainKiSphereAttack
    simCharacter.turnStats.flatKiSphereAttack = configOptions.flatObtainKiSphereAttack
}

function setAttackDetails(simChar: any, gameState: GameState, superAdditional?: boolean) {
    let highestSANum = 0;
    let saDetails;
    // If it is an additional super attack, then the SA with the lowest ki threshold is chosen
    if (superAdditional === true) {
        highestSANum = 24
        simChar.superAttacks.forEach((superAttack: any) => {
            if (simChar.turnStats.currentKi >= superAttack.kiThreshold && superAttack.kiThreshold <= highestSANum) {
                // if (superAttack.conditions(simChar, gameState) || superAttack.conditions !== null) {
                highestSANum = superAttack.kiThreshold;
                saDetails = superAttack
                // }
            }
        });
    }
    // If it is NOT an additional super attack, then it is the first attack, then the SA with the highest ki threshold (that is met) is chosen
    else if (superAdditional === undefined) {
        simChar.superAttacks.forEach((superAttack: any) => {
            if (simChar.turnStats.currentKi >= superAttack.kiThreshold && superAttack.kiThreshold >= highestSANum) {
                if (superAttack.conditions === undefined || superAttack.conditions(simChar, gameState)) {
                    highestSANum = superAttack.kiThreshold;
                    saDetails = superAttack
                }
            }
        });
    }
    // if no Ki threshold is reached or additional normal attacks
    if (saDetails === undefined) {
        saDetails = {
            multiplier: 0
        }
    }
    return saDetails;
}

// TODO: find a new name that better represents what is happening 
function calculateAdditionalAttack(simCharacter: any, chances: number): string | undefined {
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
    if (simCharacter.turnStats.attackDetails.attackBuff) {
        simCharacter.battleStats.attackBuffs.push(simCharacter.turnStats.attackDetails.attackBuff)
    }
}

function calculateKiMultiplier(simChar: Character): number {
    // For LRs over 12 Ki
    if (simChar.turnStats.currentKi > 12) {
        let kidifference = simChar.turnStats.currentKi - 12
        let multiplierIncrease = 200 - simChar.twelveKiMultiplier
        let multiplierPerKi = multiplierIncrease / 12
        let kiMultiplier = simChar.twelveKiMultiplier + (kidifference * multiplierPerKi)
        return kiMultiplier
    } else {
        let kidifference = 12 - simChar.ki100PercentThreshold
        let multiplierIncrease = simChar.twelveKiMultiplier - 1
        let multiplierPerKi = multiplierIncrease / kidifference
        let kiMultiplier = 1 + ((simChar.turnStats.currentKi - simChar.ki100PercentThreshold) * multiplierPerKi)
        return kiMultiplier
    }
}