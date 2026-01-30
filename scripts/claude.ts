// upload skill files for anthropic

import { createReadStream } from 'fs'
import { execSync } from 'child_process'
import Anthropic, { toFile } from '@anthropic-ai/sdk'

// create anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY
const client = new Anthropic({ apiKey })

// directory paths
const skill_name = 'gum-jsx'
const skills_dir = 'skills'
const zip_path = `/tmp/${skill_name}.zip`

// create skill zip file
execSync(`zip -r ${zip_path} ${skill_name}`, { cwd: skills_dir })

// upload skill files
const skill = await client.beta.skills.create({
    files: [
        await toFile(createReadStream(zip_path), `${skill_name}.zip`),
    ],
})

// output env info
console.log(`
GUM_JSX_SKILL_ID=${skill.id}
`)
