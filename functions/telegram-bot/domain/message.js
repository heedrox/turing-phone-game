exports.Message = ({
    fromBody: (body) => {
        const { message } = body
        const id = message?.chat?.id
        const text = message?.text
        return {
            userId: () => id,
            text: () => text,
            hasText: () => message && text,
            isJoin: () => text.startsWith('/join'),
            isCreate: () => text.startsWith('/create'),
            joinCode: () => text.split(' ')[1]
        }
    }
})
