describe('Random Number Generator', () => {
    it('gets a random number', () => {
        const { RandomNumberGenerator } = require('./random-number-generator')
        const generator = RandomNumberGenerator.create()
        const number = generator.get()

        expect(number).toBeLessThan(1)
    })
})