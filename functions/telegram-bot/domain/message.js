exports.Message = ({
    fromBody: (body) => {
        const message = body?.message
        const id = message?.chat?.id
        const text = message?.text
        return {
            userId: () => id,
            text: () => text,
            hasText: () => message && text,
            isJoin: () => text?.startsWith('/join'),
            isCreate: () => text?.startsWith('/create'),
            isStart: () => text?.startsWith('/start'),
            joinCode: () => text?.split(' ')[1]
        }
    }
})
