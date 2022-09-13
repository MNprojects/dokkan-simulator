export abstract class DokkanSimulator {

    static singleCharacterSimulation(character: Character, configOptions: SimConfiguration): (SimResults) {
        let results: SimResults = { results: {}, team: {}, config: {} }
        let turns = {};

        for (let turn = 1; turn <= configOptions.turns; turn++) {

            let turnName: string = 'turn ' + turn
            // @ts-ignore
            turns[turnName] = {};
            console.log(turn);

        }
        results.results = turns

        return results
    }
}

interface Character {
    name: string
}

interface SimConfiguration {
    turns: number
}

interface SimResults {
    results: Object,
    team: Object,
    config: Object
}