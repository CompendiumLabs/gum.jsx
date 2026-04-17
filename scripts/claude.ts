// upload skill files for anthropic

import { createReadStream } from 'fs'
import Anthropic, { toFile } from '@anthropic-ai/sdk'

// create anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY
const client = new Anthropic({ apiKey })

// directory paths
const skill_name = 'gum-jsx'
const skill_file = `${skill_name}.skill`
const skill_path = `skills/${skill_file}`

// upload skill files
const skill = await client.beta.skills.create({
    files: [
        await toFile(createReadStream(skill_path), skill_file),
    ],
})

// output env info
console.log(`
GUM_JSX_SKILL_ID=${skill.id}
`)
