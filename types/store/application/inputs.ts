import { ConfirmationStatus, ConfirmationStep } from './entities'

export type SetConfirmationStatus = {
  step: ConfirmationStep
  status: ConfirmationStatus
}
