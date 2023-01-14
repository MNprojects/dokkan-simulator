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
    leaderSkill1(char: Character): void,
    leaderSkill2(char: Character): void,
    enemies: any[], // TODO: Actual enemies with names/categories. Different phases?
    // TODO: Items? Support Memories?
}

export interface Buff {
    amount: number,
    turnBuffExpires: number | boolean
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
    setKiSpheresEveryTurn?: KiSpheres,
}


export interface SimResults {
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

export interface Character {
    name: string,
    title: string,
    type: Type,
    startOfTurn(gameState: GameState): void,
    collectKiSpheres(kiSpheres: KiSpheres, gameState: GameState): void, // only for rules specific to the character
    passiveAdditionalAttacks(gameState: GameState): string[], //TODO: type rather than string
    baseAttack: number,
    maxKi: number,
    categories: string[],
    links: {}[], //TODO: type definition
    additionalAttackChance: number,
    criticalChance: number,
    ki100PercentThreshold: number,
    twelveKiMultiplier: number,
    onAttack(gameState: GameState): void,
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
        attackBuffs: Buff[],
    },
}

export class CharacterBuilder {
    private readonly _character: Character;

    constructor(name: string, title: string, type: Type, baseAttack: number, maxKi: number, superAttacks: {}[], twelveKiMultiplier: number) {
        // TODO Validation
        this._character = {
            name: name,
            title: title,
            type: type, // Accept strings?
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
            passiveAdditionalAttacks: (gameState: GameState): string[] => { return [] },
            onAttack: () => { },
            turnStats: {
                percentageStartOfTurnAttackBuffs: [],
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
                superAttackDetails: "",
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
    }

    categories(categories: string[]): CharacterBuilder {
        this._character.categories = categories;
        return this;
    }

    links(links: string[]): CharacterBuilder {
        this._character.links = links;
        return this;
    }

    startOfTurn(startOfTurnPassiveFunction: any): CharacterBuilder {
        this._character.startOfTurn = startOfTurnPassiveFunction;
        return this;
    }

    build(): Character {
        return this._character;
    }
}

export class SimConfigurationBuilder {
    private readonly _config: SimConfiguration;

    constructor() {
        // TODO Validation
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
            flatObtainKiSphereAttack: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
            setKiSpheresEveryTurn: { TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 0, RBW: 0 },
        }
    }
    appearances(appearances: number): SimConfigurationBuilder {
        this._config.appearances = appearances;
        return this;
    }
    startingPosition(startingPosition: number): SimConfigurationBuilder {
        this._config.startingPosition = startingPosition;
        return this;
    }
    desiredPosition(desiredPosition: number): SimConfigurationBuilder {
        this._config.desiredPosition = desiredPosition;
        return this;
    }
    leaderSkill1(leaderSkill1: (char: Character) => {}): SimConfigurationBuilder {
        this._config.leaderSkill1 = leaderSkill1;
        return this;
    }
    leaderSkill2(leaderSkill2: (char: Character) => {}): SimConfigurationBuilder {
        this._config.leaderSkill2 = leaderSkill2;
        return this;
    }
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
        this._config.percentageObtainKiSphereAttack = percentageObtainKiSphereAttack;
        return this;
    }
    flatObtainKiSphereAttack(flatObtainKiSphereAttack: KiSpheres): SimConfigurationBuilder {
        this._config.flatObtainKiSphereAttack = flatObtainKiSphereAttack;
        return this;
    }
    setKiSpheresEveryTurn(setKiSpheresEveryTurn: KiSpheres): SimConfigurationBuilder {
        this._config.setKiSpheresEveryTurn = setKiSpheresEveryTurn;
        return this;
    }

    build(): SimConfiguration {
        return this._config;
    }
}