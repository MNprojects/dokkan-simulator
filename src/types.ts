export interface KiSpheres {
    TEQ: number,
    AGL: number,
    STR: number,
    PHY: number,
    INT: number,
    RBW: number
}

export interface GameState {
    turn: number,
    teamArray: number[]
    currentRotation: number[],
    leaderSkill1(char: Character, gameState: GameState): void,
    leaderSkill2(char: Character, gameState: GameState): void,
    enemies: Enemy[], // TODO: Actual enemies with names/categories. Different phases?
    // TODO: Items? Support Memories?
}

export interface Enemy {
    name: string,
    type: Type,
    class: Class,
    categories: string[],
    sealed: boolean,
    stunned: boolean,

}

export enum Class {
    Super = "Super",
    Extreme = "Extreme"
}

export interface Buff {
    amount: number,
    turnBuffExpires: number | boolean
}


export interface SimConfiguration {
    appearances: number,
    startingPosition: number,
    desiredPosition: number,
    leaderSkill1(char: Character, gameState: GameState): void,
    leaderSkill2(char: Character, gameState: GameState): void,
    percentageStartOfTurnAttack: number,
    flatStartOfTurnAttack: number,
    activeLinks: string[]
    percentageObtainKiSphereAttack: KiSpheres,
    flatObtainKiSphereAttack: KiSpheres,
    setKiSpheresEveryTurn?: KiSpheres,
}


export interface SimResults {
    summary: {
        averageAttackPerTurn: number,
        percentageOfAttackThatCrit: number,
        percentageOfTurnsWithAdditional: number,
    },
    turnData: TurnData[],
    team: Object,
    config: Object
}

export interface TurnData {
    turn: number,
    appearanceCount: number,
    kiSpheres: KiSpheres,
    attacks: AttackResult[]
}

export interface AttackResult {
    count: number,
    attack: number,
    critical: boolean
}

export enum Type {
    TEQ = "TEQ",
    INT = "INT",
    PHY = "PHY",
    STR = "STR",
    AGL = "AGL",
}

export interface SuperAttack {
    kiThreshold: number,
    multiplier: number,
    attackBuff?: {},
    extraCritChance?: number,
    disableGuard?: boolean,
    stun?: {},
    seal?: {},
    effectiveAgainstAll?: boolean,
    debuffTargetDEF?: {}
    // TODO: Conditions i.e., unit super attack
}

export interface Character {
    name: string,
    title: string,
    type: Type,
    class: Class,
    baseAttack: number,
    maxKi: number,
    categories: string[],
    links: Link[], //TODO: type definition
    additionalAttackChance: number,
    criticalChance: number,
    ki100PercentThreshold: number,
    twelveKiMultiplier: number,
    startOfTurn(gameState: GameState): void,
    collectKiSpheres(kiSpheres: KiSpheres, gameState: GameState): void, // only for rules specific to the character
    passiveAdditionalAttacks(gameState: GameState): void, //TODO: type rather than string
    onAttack(gameState: GameState): void,
    superAttacks: SuperAttack[], //TODO: type definition
    turnStats: {
        percentageStartOfTurnAttackBuffs: Buff[],
        percentageLeaderAttack: number,
        flatLeaderAttack: number,
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
        attackDetails: any,
        collectedKiSpheres: KiSpheres,
        additionalAttacks: string[],
        attackModifier: number,
        currentAttack: number,

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
        attackBuffs: Buff[],
    },
}

export interface Link {
    name: string,
    level?: number,
    linkFunction: (character: Character) => void,
}

export class CharacterBuilder {
    private readonly _character: Character;

    constructor(name: string, title: string, type: Type, givenClass: Class, baseAttack: number, maxKi: number, superAttacks: SuperAttack[], twelveKiMultiplier: number) {
        this._character = {
            name: name,
            title: title,
            type: type, // Accept strings?
            class: givenClass,
            baseAttack: baseAttack,
            maxKi: maxKi,
            categories: [],
            links: [],
            additionalAttackChance: 0,
            criticalChance: 0,
            superAttacks: superAttacks,
            ki100PercentThreshold: 3,
            twelveKiMultiplier: twelveKiMultiplier,
            startOfTurn: (gameState: GameState): void => { },
            collectKiSpheres: (kiSpheres: KiSpheres, gameState: GameState): void => { },
            passiveAdditionalAttacks: (gameState: GameState): void => { },
            onAttack: (gameState: GameState): void => { },
            turnStats: {
                percentageStartOfTurnAttackBuffs: [],
                percentageLeaderAttack: 0,
                flatLeaderAttack: 0,
                attackEffectiveToAll: false,
                criticalChance: 0,
                currentKi: 0,
                currentKiMultiplier: 0,
                flatStartOfTurnAttack: 0,
                percentageKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
                flatKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
                kiSphereBuffs: [],
                SABuffs: [],
                disableGuard: false,
                attackDetails: "",
                collectedKiSpheres: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
                additionalAttacks: [],
                attackModifier: 0,
                currentAttack: 0,
            },
            battleStats: {
                appearances: 0,
                stackAttack: 0,
                attackPerAttackPerformed: 0,
                attackPerAttackReceived: 0,
                attackPerAttackEvaded: 0,
                attackPerTurn: 0,
                attackPerEnemy: 0,
                attackPerFinalBlow: 0,
                attackBuffs: [],
            },
        }
        this.validate()
    }

    validate() {
        if (this._character.baseAttack < 1) {
            throw new Error("Base Attack must be a positive number");
        }
        else if (this._character.baseAttack > 30000) {
            console.warn("Warning: The base attack is unrealistically high")
        }

        if (this._character.maxKi != 24 && this._character.maxKi != 12) {
            throw new Error("Max Ki is either 12 for URs or 24 for LRs");
        }

        if (this._character.twelveKiMultiplier < 1) {
            throw new Error("The Twelve Ki Multipler should be a positive number");
        }
        else if (this._character.twelveKiMultiplier > 2) {
            console.warn("Warning: The Twelve Ki Multiplier is unrealistically high")
        }
        this._character.superAttacks.forEach(superAttack => {

            if (superAttack.kiThreshold < 1) {
                throw new Error("The Ki Threshold for a Super Attack be a positive number");
            }
            else if (superAttack.kiThreshold > 24) {
                throw new Error("The Ki Threshold for a Super Attack be less than 24");
            }
            else if (superAttack.multiplier <= 0) {
                throw new Error("The Multiplier for a Super Attack be a positive number");
            }

        });
    }

    categories(categories: string[]): CharacterBuilder {
        this._character.categories = categories;
        return this;
    }

    links(links: Link[]): CharacterBuilder {
        this._character.links = links;
        return this;
    }

    startOfTurn(startOfTurnPassiveFunction: (gameState: GameState) => void): CharacterBuilder {
        this._character.startOfTurn = startOfTurnPassiveFunction;
        return this;
    }

    collectKiSpheres(collectKiSpheresFunction: (kiSpheres: KiSpheres, gameState: GameState) => void): CharacterBuilder {
        this._character.collectKiSpheres = collectKiSpheresFunction;
        return this;
    }

    passiveAdditionalAttacks(passiveAdditionalAttacksFunction: (gameState: GameState) => void): CharacterBuilder {
        this._character.passiveAdditionalAttacks = passiveAdditionalAttacksFunction;
        return this;
    }
    onAttack(onAttackFunction: (gameState: GameState) => void): CharacterBuilder {
        this._character.onAttack = onAttackFunction;
        return this;
    }

    build(): Character {
        return this._character;
    }
}

// TODO: documentation comments
export class SimConfigurationBuilder {
    private readonly _config: SimConfiguration;

    constructor() {
        this._config = {
            appearances: 10,
            startingPosition: 0,
            desiredPosition: 0,
            leaderSkill1(char: Character): void { },
            leaderSkill2(char: Character): void { },
            percentageStartOfTurnAttack: 0,
            flatStartOfTurnAttack: 0,
            activeLinks: [],
            percentageObtainKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
            flatObtainKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 }
        }
    }


    appearances(appearances: number): SimConfigurationBuilder {
        if (appearances < 1) {
            throw new Error("Appearances must be a positive number");
        }
        this._config.appearances = appearances;
        return this;
    }

    /**
     * Sets the Starting Position slot that a character will first appear in during battle.
     * @param startingPosition Must be in the range 0 - 6, inclusive.
     */
    startingPosition(startingPosition: number): SimConfigurationBuilder {
        if (startingPosition != Number(startingPosition.toFixed())) {
            throw new Error("Starting Position must be a whole (positive) number");
        }
        if (startingPosition < 0 || startingPosition > 6) {
            throw new Error("Starting Position must be a positive number between 0 and 6 (inc)");
        }
        this._config.startingPosition = startingPosition;
        return this;
    }

    desiredPosition(desiredPosition: number): SimConfigurationBuilder {
        if (desiredPosition != Number(desiredPosition.toFixed())) {
            throw new Error("Desired Position must be a whole (positive) number");
        }
        if (desiredPosition < 0 || desiredPosition > 6) {
            throw new Error("Desired Position must be a positive number between 0 and 6 (inc)");
        }
        this._config.desiredPosition = desiredPosition;
        return this;
    }
    // TODO: Validation (What can I even do here?)
    leaderSkill1(leaderSkill1: (char: Character) => {}): SimConfigurationBuilder {
        this._config.leaderSkill1 = leaderSkill1;
        return this;
    }
    leaderSkill2(leaderSkill2: (char: Character) => {}): SimConfigurationBuilder {
        this._config.leaderSkill2 = leaderSkill2;
        return this;
    }

    /**
     * Applies a start of turn buff mimicing a teammate i.e., Turles +40% attack. Can be negative to cater for debuffs i.e., ToP INT Golden Freiza -15% to Super allies
     * @param percentageStartOfTurnAttack Decimal representation of the percentage increase. i.e., 0.4 is a 40% buff
     */
    percentageStartOfTurnAttack(percentageStartOfTurnAttack: number): SimConfigurationBuilder {
        this._config.percentageStartOfTurnAttack = percentageStartOfTurnAttack;
        return this;
    }
    flatStartOfTurnAttack(flatStartOfTurnAttack: number): SimConfigurationBuilder {
        this._config.flatStartOfTurnAttack = flatStartOfTurnAttack;
        return this;
    }
    activeLinks(activeLinks: string[]): SimConfigurationBuilder {
        this._config.activeLinks = activeLinks;
        return this;
    }
    percentageObtainKiSphereAttack(percentageObtainKiSphereAttack: KiSpheres): SimConfigurationBuilder {
        Object.entries(percentageObtainKiSphereAttack).forEach(kiSphere => {
            if (kiSphere[1] < 0) {
                // throw new Error("Ki Spheres");
            }
        });
        this._config.percentageObtainKiSphereAttack = percentageObtainKiSphereAttack;
        return this;
    }
    flatObtainKiSphereAttack(flatObtainKiSphereAttack: KiSpheres): SimConfigurationBuilder {
        this._config.flatObtainKiSphereAttack = flatObtainKiSphereAttack;
        return this;
    }
    setKiSpheresEveryTurn(setKiSpheresEveryTurn: KiSpheres): SimConfigurationBuilder {
        let chosenType: string | null = null;
        Object.entries(setKiSpheresEveryTurn).forEach(kiSphere => {
            if (kiSphere[1] < 0) {
                throw new Error("Set Ki Spheres Every Turn cannot have any negative numbers");
            }
            if (kiSphere[1] != Number(kiSphere[1].toFixed())) {
                throw new Error("Set Ki Spheres Every Turn can only be whole numbers");
            }
            if (kiSphere[1] > 24) {
                throw new Error("Set Ki Spheres Every Turn can only go up to a maximum of 24");
            }
            if (kiSphere[1] > 0 && kiSphere[0] != "RBW") {
                if (chosenType != null) {
                    throw new Error("Set Ki Spheres Every Turn can only have a single typed ki sphere with a value above 0");
                } else {
                    chosenType = kiSphere[0]
                }
            }
        });

        if (setKiSpheresEveryTurn.RBW > 5) {
            throw new Error("Set Ki Spheres Every Turn can only have up to 5 RBW spheres");
        }
        else if (setKiSpheresEveryTurn.RBW === 5 && chosenType != null) {
            throw new Error("Set Ki Spheres Every Turn can't have a typed ki sphere with 5 RBW spheres");
        }
        else if (setKiSpheresEveryTurn.RBW > 0 && chosenType === null) {
            throw new Error("Set Ki Spheres Every Turn can't have a RBW spheres (below 5) without at least 1 typed sphere");
        }

        this._config.setKiSpheresEveryTurn = setKiSpheresEveryTurn;
        return this;
    }

    build(): SimConfiguration {
        return this._config;
    }
}