import Ajv from 'ajv'

import { statusSchema } from './relayer'

const ajv = new Ajv()

ajv.addSchema(statusSchema, 'relayer')

export { ajv }
