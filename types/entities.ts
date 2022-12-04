export type ModalProps = {
  name?: string
  resizable?: boolean
  adaptive?: boolean
  draggable?: boolean | string
  scrollable?: boolean
  focusTrap?: boolean
  reset?: boolean
  clickToClose?: boolean
  transition?: string
  overlayTransition?: string
  classes?: string | string[]
  styles?: string | string[]
  width?: string | number
  height?: string | number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  shiftX?: number
  shiftY?: number
}
