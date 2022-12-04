const addressType = { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }

const statusSchema = {
  type: 'object',
  properties: {
    rewardAddress: addressType,
    chainId: { type: 'number' },
    version: { type: 'string' },
    serviceFee: {
      type: 'object',
      properties: {
        transfer: {
          type: 'string',
        },
        withdrawal: {
          type: 'number',
          maximum: 20,
          minimum: 0,
        },
      },
    },
    health: {
      type: 'object',
      properties: {
        status: { const: true },
        error: { type: 'string' },
      },
      required: ['status'],
    },
  },
  required: ['rewardAddress', 'chainId', 'serviceFee', 'health'],
}

export { statusSchema }
