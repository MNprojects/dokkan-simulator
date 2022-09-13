export abstract class DokkanSimulator {

    static singleCharacterSimulation(character: Character, configOptions: SimConfiguration) {
        console.log(character.name);
        
        return character.name
    }
}

interface Character {
    name: string
}

interface SimConfiguration {

}