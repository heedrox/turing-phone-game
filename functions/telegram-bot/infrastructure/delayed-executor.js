exports.DelayedExecutor = ({
    create: () => ({
        execute: (fn, msecs) => setTimeout(fn, msecs)
    })
})