import type { Design, ProductInfo } from './types'
export const DEFAULT_INFO: ProductInfo = { visible: false, placement: 'bottom', showSpecs: true, description: '', contents: '', care: '', warnings: '', origin: '', website: '', sku: '', barcode: '' }
export const getProductInfo = (design: Design): ProductInfo => ({ ...DEFAULT_INFO, ...design.productInfo })
export function infoCopy(design: Design) {
  const info = getProductInfo(design)
  return [design.name === 'Untitled idea' ? 'Product information' : design.name, info.description, info.contents && `CONTENTS\n${info.contents}`, info.care && `CARE & USE\n${info.care}`, info.warnings && `PLEASE NOTE\n${info.warnings}`, info.origin, info.website, info.sku && `SKU: ${info.sku}`, info.showSpecs && `${design.dimensions.length} × ${design.dimensions.width} × ${design.dimensions.height} mm\n${design.material} · ${design.finish}`].filter(Boolean).join('\n\n')
}
export function validBarcode(code: string) {
  if (!/^\d{13}$/.test(code)) return false
  const total = [...code.slice(0, 12)].reduce((sum, digit, index) => sum + +digit * (index % 2 ? 3 : 1), 0)
  return (10 - total % 10) % 10 === +code[12]
}
export function barcodeBits(code: string) {
  const left = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']
  const even = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111']
  const parity = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL']
  return '101' + [...code.slice(1,7)].map((digit, index) => (parity[+code[0]][index] === 'L' ? left : even)[+digit]).join('') + '01010' + [...code.slice(7)].map(digit => left[+digit].replace(/[01]/g, bit => bit === '0' ? '1' : '0')).join('') + '101'
}
