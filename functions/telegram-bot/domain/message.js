exports.Message = ({
    fromBody: (body) => {
        const message = body?.message
        const id = message?.chat?.id
        const text = message?.text
        return {
            userId: () => id,
            text: () => text,
            hasText: () => message && text,
            isJoin: () => text?.startsWith('/join') || text?.startsWith('/start'),
            isCreate: () => text?.startsWith('/create'),
            isGo: () => text?.startsWith('/go'),
            isReveal: () => text?.startsWith('/reveal'),
            joinCode: () => text?.split(' ')[1]
        }
    }
})
