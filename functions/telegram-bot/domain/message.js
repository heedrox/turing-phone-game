exports.Message = ({
    fromBody: (body) => {
        const {
            message: {
                chat: {id},
                text
            }
        } = body
        return {
            userId: () => id,
            text: () => text,
            isJoin: () => text.startsWith('/join'),
            isCreate: () => text.startsWith('/create'),
            joinCode: () => text.split(' ')[1]
        }
    }
})
