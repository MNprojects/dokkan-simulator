import { DokkanSimulator } from '../src/dokkanSimulator';
import { Character, CharacterBuilder, SimConfiguration, KiSpheres, Type, GameState, SimConfigurationBuilder, Class } from '../src/types';
import { strictEqual } from "assert";

let baseCharacter: Character;
let config: SimConfiguration;

beforeEach(function () {
    baseCharacter = new CharacterBuilder("Test", "Title", Type.TEQ, Class.Super, 10000, 12, [], 1)
        .build()
    config = new SimConfigurationBuilder()
        .appearances(3)
        .setKiSpheresEveryTurn({ TEQ: 0, AGL: 0, STR: 0, PHY: 0, INT: 5, RBW: 1 })
        .build()
})

describe('Single Character Simulation', function () {
    it('should have the same number of turns as given in the config', function () {
        let expectedAppearances = 4
        config.appearances = expectedAppearances;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(Object.keys(result.turnData).length, expectedAppearances);
    });

    it('should have an unmodified attack in the results', function () {
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, baseCharacter.baseAttack);
    });

    it('should modify attack by the percentage leaderskills', function () {
        config.leaderSkill1 = (char: any, gameState: GameState) => {
            char.turnStats.percentageLeaderAttack += 1.7;
        }
        config.leaderSkill2 = (char: any) => {
            char.turnStats.percentageLeaderAttack += 1.7;
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 44000);
    });

    it('should modify attack by the flat and percentage leaderskills', function () {
        config.leaderSkill1 = (char: any, gameState: GameState) => {
            char.turnStats.flatLeaderAttack += 30000;
        }
        config.leaderSkill2 = (char: any, gameState: GameState) => {
            char.turnStats.percentageLeaderAttack += 1.7;
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 57000);
    });

    it('should modify attack by percentage start of turn passives', function () {
        baseCharacter.startOfTurn = function () {
            this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 0.5, turnBuffExpires: 1 })
        }
        config.percentageStartOfTurnAttack = 0.3;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[0].attacks[0].attack, 18000);
    });

    it('should modify attack by flat start of turn passives', function () {
        baseCharacter.startOfTurn = function () {
            this.turnStats.flatStartOfTurnAttack = 1000
        }
        config.flatStartOfTurnAttack = 3000;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[0].attacks[0].attack, 14000);
    });

    it('should modify attack by percentage at the start of turn for a set amount of turns, then expire', function () {
        baseCharacter.startOfTurn = function (this: Character, gamestate: GameState) {
            if (this.battleStats.appearances === 1) {
                this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 0.5, turnBuffExpires: 2 });
            }
        }
        config.percentageStartOfTurnAttack = 0.3;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[0].attacks[0].attack, 18000);
        strictEqual(result.turnData[1].attacks[0].attack, 13000);


    });

    it('should modify attack by leaderskills AND start of turn passives', function () {
        config.leaderSkill1 = function (char: Character, gameState: GameState) {
            // 27,000
            char.turnStats.percentageLeaderAttack += 1.7;
            // 32,000
            char.turnStats.flatLeaderAttack += 5000;
            return char
        }
        // 105,600
        config.percentageStartOfTurnAttack = 2.3;
        baseCharacter.startOfTurn = function () {
            // @ts-ignore
            this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 2, turnBuffExpires: 1 })// 169,600
            // @ts-ignore
            this.turnStats.flatStartOfTurnAttack = 1000     // 170,600
        }
        // 173,600
        config.flatStartOfTurnAttack = 3000;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 173600);
    });

    it('should modify attack by percentage nuking passives', function () {
        baseCharacter.collectKiSpheres = function (collectedKiSpheres: KiSpheres) {
            Object.entries(collectedKiSpheres).forEach(
                ([key, value]) => {
                    // @ts-ignore
                    this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: this.turnStats.percentageKiSphereAttack[key] * value, turnBuffExpires: 1 })
                });

        }
        config.percentageObtainKiSphereAttack = { TEQ: 0.1, AGL: 0.2, STR: 0.3, PHY: 0.4, INT: 0.5, RBW: 0.6 };

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        // section finds the number of orbs actually collected to allow them to be randomised but still work for the test
        let expectedAttackBoost: number = 0
        Object.entries(result.turnData[0].kiSpheres).forEach(([key, value]) =>
            // @ts-ignore
            expectedAttackBoost += config.percentageObtainKiSphereAttack[key] * value
        )

        strictEqual(result.turnData[1].attacks[0].attack, baseCharacter.baseAttack * (1 + expectedAttackBoost));
    });

    it('should modify attack by flat nuking passives', function () {
        baseCharacter.collectKiSpheres = function (collectedKiSpheres: KiSpheres) {
            Object.entries(collectedKiSpheres).forEach(
                ([key, value]) => {
                    // @ts-ignore
                    this.turnStats.flatStartOfTurnAttack += this.turnStats.flatKiSphereAttack[key] * value
                });
        }
        config.flatObtainKiSphereAttack = { TEQ: 10, AGL: 205, STR: 3000, PHY: 4000, INT: 50000, RBW: 6 };
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        // section finds the number of orbs actually collected to allow them to be randomised but still work for the test
        let expectedAttackBoost: number = 0
        // @ts-ignore
        Object.entries(result.turnData[0].kiSpheres).forEach(([key, value]) =>
            // @ts-ignore
            expectedAttackBoost += config.flatObtainKiSphereAttack[key] * value
        )
        strictEqual(result.turnData[1].attacks[0].attack, baseCharacter.baseAttack + expectedAttackBoost);
    });

    it('should have attack modified by the active links', function () {
        baseCharacter.links = [
            {
                name: "Super Saiyan",
                linkFunction: function (char: any) {
                    char.turnStats.percentageLinksAttack += 0.1
                }
            },
            {
                name: "Saiyan Roar",
                linkFunction: function (char: any) { char.turnStats.percentageLinksAttack += 0.25 }
            },
            {
                name: "Prepared for Battle",
                linkFunction: function (char: any) { char.turnStats.percentageLinksAttack += 0.3 }
            },
        ]
        config.activeLinks = ["Super Saiyan", "Saiyan Roar"]

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 13500);
    });

    it('should have attack modified by the ki multiplier', function () {
        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12;
        }
        baseCharacter.twelveKiMultiplier = 1.4;
        baseCharacter.ki100PercentThreshold = 3;

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 14000);
    });

    it('should have attack modified by build up passive', function () {
        baseCharacter.onAttack = function () {
            // unrealistic but appropriate to test the simulator (not the character)
            // a real character would set these at the appropriate times to appropriate values
            this.battleStats.stackAttack += 0.1
            this.battleStats.attackPerAttackPerformed = 0.2,
                this.battleStats.attackPerAttackReceived = 0.3,
                this.battleStats.attackPerAttackEvaded = 0.4,
                this.battleStats.attackPerTurn = 0.5,
                this.battleStats.attackPerEnemy = 0.6,
                this.battleStats.attackPerFinalBlow = 0.7
        }

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[0].attacks[0].attack, 38000);
    });

    it('should have attack modified by SA modifier if ki threshold is reached', function () {
        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 6.3,
            },
            {
                kiThreshold: 18,
                multiplier: 7.2
            }
        ]

        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12
        }

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 73000);
    });

    it('should use the SA for the Ki threshold reached', function () {
        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 0.5, //unrealistic number for immense damage etc
            },
            {
                kiThreshold: 11,
                multiplier: 0.4
            }
        ]

        baseCharacter.onAttack = function () {
            this.turnStats.currentKi = 11
        }

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 14000);
    });

    it('should have attack modified by multiple: (Leader skills, Start of Turn, Links, Ki Multiplier, SA modifier)', function () {
        config.leaderSkill1 = function (char: Character, gameState: GameState) {
            char.turnStats.percentageLeaderAttack += 2;
            return char
        }
        config.leaderSkill2 = function (char: any) {
            char.turnStats.percentageLeaderAttack += 1.9;
            return char
        }
        config.activeLinks = ["Super Saiyan", "Saiyan Roar"]

        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12
            this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 0.5, turnBuffExpires: 1 })
        }
        baseCharacter.links = [
            { name: "Super Saiyan", linkFunction: function (char: any) { char.turnStats.percentageLinksAttack += 0.1 } },
            { name: "Saiyan Roar", linkFunction: function (char: any) { char.turnStats.percentageLinksAttack += 0.25 } },
            { name: "Prepared for Battle", linkFunction: function (char: any) { char.turnStats.percentageLinksAttack += 0.3 } },
        ]
        baseCharacter.twelveKiMultiplier = 1.5;
        baseCharacter.ki100PercentThreshold = 4;

        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 0.5,
            }
        ]
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 223255);
    });

    it('should do a hidden potential additional attack', function () {
        baseCharacter.additionalAttackChance = 1;
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[1].attack, 10000);
        strictEqual(result.summary.decimalOfTurnsWithAdditional, 1);
    });

    it('should do additional attacks from passive', function () {
        baseCharacter.passiveAdditionalAttacks = function (gameState: GameState) {
            this.turnStats.additionalAttacks.push("normal", "super")
        }

        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 0.6,
            },
            {
                kiThreshold: 11,
                multiplier: 0.4
            }
        ]

        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12
        }

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 16000);
        strictEqual(result.turnData[1].attacks[1].attack, 10000);
        strictEqual(result.turnData[1].attacks[2].attack, 14000);
    });

    it('should be able to critical strike', function () {
        baseCharacter.criticalChance = 1;

        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)

        strictEqual(result.turnData[1].attacks[0].attack, 18750);

    });

    it('attacks should be effective against all', function () {
        baseCharacter.startOfTurn = function () {
            this.turnStats.attackEffectiveToAll = true;
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 15000);

    });

    it('match scenario character - INT Gogeta', function () {
        baseCharacter.baseAttack = 15695;
        baseCharacter.startOfTurn = function () {
            this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 1.2, turnBuffExpires: 1 });
            this.turnStats.attackEffectiveToAll = true;
        }
        baseCharacter.collectKiSpheres = function (collectedKiSpheres: KiSpheres) {
            if (collectedKiSpheres.RBW > 1) {
                this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 0.4, turnBuffExpires: 1 })
            }
            if (collectedKiSpheres.RBW > 2) {
                this.turnStats.criticalChance += 0.5;
            }
        }
        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 1.5,
            }
        ]
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 51793);
    });

    it('match attack scenario character - TEQ LR Gods', function () {
        let baseChar: Character = new CharacterBuilder("Super Saiyan God Goku & Super Saiyan God Vegeta", "Divine Warriors with Infinite Power", Type.TEQ, Class.Super, 22075, 24, [{
            kiThreshold: 12,
            multiplier: 4.25,
            attackBuff: {},
            extraCritChance: 0,
            disableGuard: false,
            stun: {},
            seal: {},
            effectiveAgainstAll: false,
            debuffTargetDEF: {}

        },
        {
            kiThreshold: 18,
            multiplier: 5.7,
        }], 1.6)
            .startOfTurn(function (this: Character, gameState: GameState) {
                if (this.battleStats.appearances === 1) {
                    this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 0.77, turnBuffExpires: gameState.turn + 7 });
                }
                this.turnStats.percentageStartOfTurnAttackBuffs.push({ amount: 1.2, turnBuffExpires: false });
            })
            .collectKiSpheres(function (this: Character, collectedKiSpheres: KiSpheres, gameState: GameState) {
                this.turnStats.criticalChance += collectedKiSpheres.RBW * 0.07
                if (this.battleStats.appearances === 1) {
                    this.turnStats.kiSphereBuffs.push({ amount: 1, turnBuffExpires: gameState.turn + 1, types: ["TEQ", "AGL", "STR", "PHY", "INT"] }) // Use Type.TEQ etc?
                }
                this.turnStats.kiSphereBuffs.push({ amount: 1, turnBuffExpires: 99, types: ["TEQ", "AGL", "STR", "PHY", "INT"] }) // Use Type.TEQ etc?
            })
            .passiveAdditionalAttacks(function (this: Character, gameState: GameState) {
                if (this.turnStats.currentKi > 19) {
                    return ["super"]
                }
                return []
            })
            .onAttack(function (this: Character, gameState: GameState) {
                if (this.turnStats.currentKi === 24) {
                    this.turnStats.attackEffectiveToAll = true;
                }
            })
            .build()

        config.appearances = 5;
        let result = DokkanSimulator.singleCharacterSimulation(baseChar, config)

        if (result.turnData[1].attacks[0].critical) {
            // Crit
            strictEqual(result.turnData[1].attacks[0].attack, 147513);
        } else {
            strictEqual(result.turnData[1].attacks[0].attack, 78674);
        }

        if (result.turnData[4].attacks[0].critical) {
            // Crit
            strictEqual(result.turnData[4].attacks[0].attack, 109271);
        } else {
            strictEqual(result.turnData[4].attacks[0].attack, 58278);
        }
    });

    it('should use a unit super attack when conditions are met', function () {
        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 1.5,
            },
            {
                kiThreshold: 12,
                multiplier: 1.7,
                conditions: function (baseCharacter: Character, gameState: GameState) {
                    return true
                },
            }
        ]
        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12;
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 27000);
    });

    it('should not use a unit super attack when conditions are not met', function () {
        baseCharacter.superAttacks = [
            {
                kiThreshold: 12,
                multiplier: 1.5,
            },
            {
                kiThreshold: 12,
                multiplier: 1.7,
                conditions: function (baseCharacter: Character, gameState: GameState) {
                    return false
                },
            }
        ]
        baseCharacter.startOfTurn = function () {
            this.turnStats.currentKi += 12;
        }
        let result = DokkanSimulator.singleCharacterSimulation(baseCharacter, config)
        strictEqual(result.turnData[1].attacks[0].attack, 25000);
    });

});



