exports.RandomNumberGenerator = ({
    create: () => ({
        get: () => Math.random()
    })
})