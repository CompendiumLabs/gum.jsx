// types

class ErrorNoCode extends Error {
    constructor() {
        super('No code provided')
    }
}

class ErrorNoReturn extends Error {
    constructor() {
        super()
    }
}

class ErrorNoElement extends Error {
    constructor(value) {
        super(`Non-element returned: ${JSON.stringify(value)}`)
        this.value = value
    }
}

class ErrorGenerate extends Error {
    constructor(message) {
        super(`Generation error: ${message}`)
    }
}

class ErrorRender extends Error {
    constructor(message) {
        super(`Render error: ${message}`)
    }
}

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender }
